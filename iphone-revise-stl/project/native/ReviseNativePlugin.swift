import Foundation
import Capacitor
import Security
import QuickLook
import UIKit

private final class SameHostRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(request.url?.scheme == "https" && request.url?.host == response.url?.host ? request : nil)
    }
}

@objc(ReviseNativePlugin)
public class ReviseNativePlugin: CAPPlugin, CAPBridgedPlugin, QLPreviewControllerDataSource {
    public let identifier = "ReviseNativePlugin"
    public let jsName = "ReviseNative"
    public let pluginMethods: [CAPPluginMethod] = [
        "content", "syncContent", "asset", "previewAsset", "downloadOffline", "shareProgress", "login", "answerSecurity", "selectAccount", "refreshNotes", "cachedNotes", "disconnect"
    ].map { CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise) }
    private let contentNames = ["data.json", "flashcards.json", "manipulations.json", "diagrams.json", "supplements.json"]
    private let github = "https://raw.githubusercontent.com/lilegyy/Revise-STL/"
    private let api = "https://api.ecoledirecte.com/v3/"
    private let fm = FileManager.default
    private let session: URLSession = {
        let config = URLSessionConfiguration.ephemeral
        config.httpShouldSetCookies = true
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.timeoutIntervalForRequest = 25
        return URLSession(configuration: config, delegate: SameHostRedirects(), delegateQueue: nil)
    }()
    private var pending: [String: String]?
    private var previewURL: URL?
    private var root: URL {
        let url = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("revise-stl")
        try? fm.createDirectory(at: url, withIntermediateDirectories: true)
        var values = URLResourceValues(); values.isExcludedFromBackup = true
        var mutable = url; try? mutable.setResourceValues(values)
        return url
    }
    private func fail(_ message: String) -> NSError { NSError(domain: "ReviseSTL", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
    private func run(_ call: CAPPluginCall, _ operation: @escaping () async throws -> [String: Any]) {
        Task {
            do { call.resolve(try await operation()) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    private func validAsset(_ value: String) throws -> String {
        guard value.hasPrefix("assets/"), value.count < 500,
              !value.contains("\\"), !value.contains("?"), !value.contains("#"),
              !value.split(separator: "/", omittingEmptySubsequences: false).contains(where: { $0 == ".." || $0 == "." || $0.isEmpty })
        else { throw fail("Chemin de ressource non autorisé.") }
        return value
    }
    private func request(_ url: URL, method: String = "GET", body: Data? = nil, headers: [String: String] = [:]) async throws -> (Data, HTTPURLResponse) {
        guard url.scheme == "https", ["api.ecoledirecte.com", "api.github.com", "raw.githubusercontent.com"].contains(url.host ?? "") else { throw fail("Adresse non autorisée.") }
        var req = URLRequest(url: url); req.httpMethod = method; req.httpBody = body
        req.setValue("Révise-STL-iOS/1.0", forHTTPHeaderField: "User-Agent")
        for (key, value) in headers { req.setValue(value, forHTTPHeaderField: key) }
        let (data, raw) = try await session.data(for: req)
        guard let response = raw as? HTTPURLResponse, (200..<300).contains(response.statusCode) else { throw fail("Le service ne répond pas normalement. Réessaie plus tard.") }
        return (data, response)
    }
    private func json(_ data: Data) throws -> [String: Any] {
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else { throw fail("Réponse inattendue du service.") }
        return object
    }
    private func writePrivate(_ data: Data, to url: URL) throws {
        try fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: url, options: [.atomic, .completeFileProtection])
    }
    private func revision() -> String { UserDefaults.standard.string(forKey: "revise-content-commit") ?? "main" }
    private func contentDirectory(_ sha: String) -> URL { root.appendingPathComponent("content/" + sha) }
    private func contentData(_ name: String) throws -> Data {
        guard contentNames.contains(name) else { throw fail("Fichier de cours inconnu.") }
        let cached = contentDirectory(revision()).appendingPathComponent(name)
        if fm.fileExists(atPath: cached.path) { return try Data(contentsOf: cached) }
        guard let bundle = Bundle.main.url(forResource: name, withExtension: nil, subdirectory: "public") else { throw fail("Le cours embarqué est absent.") }
        return try Data(contentsOf: bundle)
    }
    @objc func content(_ call: CAPPluginCall) {
        run(call) { [self] in
            let name = call.getString("name") ?? ""
            guard let text = String(data: try contentData(name), encoding: .utf8) else { throw fail("Fichier de cours illisible.") }
            return ["text": text, "revision": revision()]
        }
    }
    @objc func syncContent(_ call: CAPPluginCall) {
        run(call) { [self] in
            let (meta, _) = try await request(URL(string: "https://api.github.com/repos/lilegyy/Revise-STL/commits/main")!)
            guard let sha = try json(meta)["sha"] as? String, sha.range(of: "^[0-9a-f]{40}$", options: .regularExpression) != nil else { throw fail("Version GitHub invalide.") }
            if revision() == sha { return ["changed": false, "revision": sha] }
            let target = contentDirectory(sha)
            var documents: [String: Data] = [:]
            for name in contentNames {
                let (data, _) = try await request(URL(string: github + sha + "/" + name)!)
                guard data.count < 15_000_000 else { throw fail("Un fichier de cours est trop volumineux.") }
                let parsed = try JSONSerialization.jsonObject(with: data)
                if name == "data.json" {
                    guard let groups = parsed as? [String: [[String: Any]]] else { throw fail("Structure des cours invalide ; ancienne version conservée.") }
                    var ids = Set<String>()
                    for chapter in groups.values.flatMap({ $0 }) {
                        guard let id = chapter["id"] as? String, ids.insert(id).inserted, chapter["cours"] is String, chapter["exercices"] is [[String: Any]] else { throw fail("Cours incomplet ou dupliqué ; ancienne version conservée.") }
                    }
                } else if ["flashcards.json", "manipulations.json"].contains(name) {
                    guard parsed is [Any] else { throw fail("Liste de ressources invalide ; ancienne version conservée.") }
                } else { guard parsed is [String: Any] else { throw fail("Catalogue de ressources invalide ; ancienne version conservée.") } }
                documents[name] = data
            }
            // Le pointeur n'est déplacé qu'une fois les cinq fichiers valides et écrits.
            for (name, data) in documents { try writePrivate(data, to: target.appendingPathComponent(name)) }
            UserDefaults.standard.set(sha, forKey: "revise-content-commit")
            return ["changed": true, "revision": sha]
        }
    }
    private func assetURL(_ value: String, commit: String? = nil) async throws -> URL {
        let name = try validAsset(value)
        let sha = commit ?? revision()
        let target = contentDirectory(sha).appendingPathComponent(name)
        if fm.fileExists(atPath: target.path) { return target }
        var remote = URL(string: github + sha)!
        for component in name.split(separator: "/") { remote.appendPathComponent(String(component)) }
        let (data, _) = try await request(remote)
        guard data.count < 80_000_000 else { throw fail("Ressource trop volumineuse.") }
        try writePrivate(data, to: target)
        return target
    }
    @objc func asset(_ call: CAPPluginCall) {
        run(call) { [self] in ["path": try await assetURL(call.getString("path") ?? "").absoluteString] }
    }
    @objc func downloadOffline(_ call: CAPPluginCall) {
        run(call) { [self] in
            let sha = revision()
            guard sha != "main" else { throw fail("Actualise d’abord les cours avant le téléchargement complet.") }
            let (data, _) = try await request(URL(string: "https://api.github.com/repos/lilegyy/Revise-STL/git/trees/" + sha + "?recursive=1")!)
            let tree = try json(data)
            guard tree["truncated"] as? Bool != true, let files = tree["tree"] as? [[String: Any]] else { throw fail("La liste de fichiers GitHub est incomplète.") }
            let assets = files.filter { ($0["type"] as? String) == "blob" && ($0["path"] as? String ?? "").hasPrefix("assets/") }
            let size = assets.reduce(0) { $0 + ($1["size"] as? Int ?? 0) }
            guard size < 300_000_000, assets.count < 2000 else { throw fail("Le téléchargement complet est trop volumineux.") }
            for (index, file) in assets.enumerated() {
                guard let path = file["path"] as? String else { continue }
                _ = try await assetURL(path, commit: sha)
                await MainActor.run { self.notifyListeners("offlineProgress", data: ["completed": index + 1, "total": assets.count]) }
            }
            return ["files": assets.count]
        }
    }
    @objc func shareProgress(_ call: CAPPluginCall) {
        guard let text = call.getString("text"), let data = text.data(using: .utf8), data.count < 1_000_000,
              (try? JSONSerialization.jsonObject(with: data)) is [String: Any] else { call.reject("Sauvegarde invalide."); return }
        do {
            let file = root.appendingPathComponent("exports/revise-progression.json")
            try writePrivate(data, to: file)
            DispatchQueue.main.async {
                let sheet = UIActivityViewController(activityItems: [file], applicationActivities: nil)
                if let view = self.bridge?.viewController?.view { sheet.popoverPresentationController?.sourceView = view; sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1) }
                self.bridge?.viewController?.present(sheet, animated: true)
                call.resolve()
            }
        } catch { call.reject("Impossible de préparer la sauvegarde.") }
    }
    @objc func previewAsset(_ call: CAPPluginCall) {
        Task {
            do {
                let url = try await assetURL(call.getString("path") ?? "")
                await MainActor.run {
                    self.previewURL = url
                    let controller = QLPreviewController(); controller.dataSource = self
                    self.bridge?.viewController?.present(controller, animated: true)
                    call.resolve()
                }
            } catch { call.reject(error.localizedDescription) }
        }
    }
    public func numberOfPreviewItems(in controller: QLPreviewController) -> Int { previewURL == nil ? 0 : 1 }
    public func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem { previewURL! as NSURL }
    private func secureSave(_ value: [String: Any]) throws {
        let data = try JSONSerialization.data(withJSONObject: value)
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "fr.lilegyy.revisestl.ecoledirecte", kSecAttrAccount as String: "session"]
        var query = base; query[kSecValueData as String] = data; query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        let status = SecItemUpdate(base as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound { guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else { throw fail("Impossible de protéger la session sur cet appareil.") } }
        else if status != errSecSuccess { throw fail("Impossible de protéger la session sur cet appareil.") }
    }
    private func secureRead() throws -> [String: Any] {
        let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "fr.lilegyy.revisestl.ecoledirecte", kSecAttrAccount as String: "session", kSecReturnData as String: true]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { throw fail("Connecte-toi à ÉcoleDirecte pour actualiser tes notes.") }
        return try json(data)
    }
    private func ed(_ path: String, data: [String: Any], token: String = "", twoFA: String = "", gtk: String = "") async throws -> ([String: Any], HTTPURLResponse) {
        let raw = try JSONSerialization.data(withJSONObject: data)
        // ÉcoleDirecte attend un champ data contenant un objet JSON.
        var allowed = CharacterSet.urlQueryAllowed; allowed.remove(charactersIn: "+&=;?#")
        let encoded = String(data: raw, encoding: .utf8)!.addingPercentEncoding(withAllowedCharacters: allowed)!
        var headers = ["Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json", "Origin": "https://www.ecoledirecte.com", "Referer": "https://www.ecoledirecte.com/"]
        if !token.isEmpty { headers["X-Token"] = token }
        if !twoFA.isEmpty { headers["2fa-Token"] = twoFA }
        if !gtk.isEmpty { headers["X-Gtk"] = gtk }
        let (result, response) = try await request(URL(string: api + path)!, method: "POST", body: Data(("data=" + encoded).utf8), headers: headers)
        return (try json(result), response)
    }
    private func loginResult(_ response: [String: Any], header: HTTPURLResponse, identifier: String, password: String) async throws -> [String: Any] {
        let code = response["code"] as? Int ?? 0
        if code == 250 {
            let token = response["token"] as? String ?? ""
            let fa = header.value(forHTTPHeaderField: "2fa-token") ?? ""
            pending = ["identifier": identifier, "password": password, "token": token, "twoFA": fa]
            let (challenge, challengeHeader) = try await ed("connexion/doubleauth.awp?verbe=get", data: [:], token: token, twoFA: fa)
            guard challenge["code"] as? Int == 200, let content = challenge["data"] as? [String: Any] else { pending = nil; throw fail("Impossible de récupérer la question de sécurité.") }
            pending?["twoFA"] = challengeHeader.value(forHTTPHeaderField: "2fa-token") ?? fa
            return ["security": true, "question": content["question"] ?? "", "choices": content["propositions"] ?? []]
        }
        guard code == 200, let content = response["data"] as? [String: Any], let accounts = content["accounts"] as? [[String: Any]], let token = response["token"] as? String else {
            pending = nil
            throw fail(code == 505 ? "Identifiant ou mot de passe incorrect." : "Connexion refusée par ÉcoleDirecte. Son protocole peut avoir changé.")
        }
        let students = accounts.filter { String(describing: $0["typeCompte"] ?? "") == "E" }
        guard !students.isEmpty else { pending = nil; throw fail("Cette première version prend en charge les comptes élèves. Utilise ton compte élève.") }
        var saved: [String: Any] = ["token": token, "accounts": students]
        if students.count == 1 { saved["accountID"] = String(describing: students[0]["id"]!) }
        try secureSave(saved); pending = nil
        return ["security": false, "accounts": students.map { ["id": String(describing: $0["id"]!), "name": ($0["prenom"] as? String ?? "") + " " + ($0["nom"] as? String ?? "")] }]
    }
    @objc func login(_ call: CAPPluginCall) {
        run(call) { [self] in
            let identifier = call.getString("identifier") ?? "", password = call.getString("password") ?? ""
            guard !identifier.isEmpty, !password.isEmpty else { throw fail("Renseigne ton identifiant et ton mot de passe.") }
            let (_, response) = try await request(URL(string: api + "login.awp?gtk=1")!, headers: ["Origin": "https://www.ecoledirecte.com", "Referer": "https://www.ecoledirecte.com/"])
            let cookies = HTTPCookie.cookies(withResponseHeaderFields: response.allHeaderFields.reduce(into: [String: String]()) { result, pair in result[String(describing: pair.key)] = String(describing: pair.value) }, for: response.url!)
            for cookie in cookies { HTTPCookieStorage.shared.setCookie(cookie) }
            let gtk = (HTTPCookieStorage.shared.cookies(for: URL(string: api)!) ?? []).first { $0.name.uppercased() == "GTK" }?.value ?? ""
            guard !gtk.isEmpty else { throw fail("ÉcoleDirecte n’a pas fourni le jeton de connexion. Réessaie plus tard.") }
            let (object, header) = try await ed("login.awp", data: ["identifiant": identifier, "motdepasse": password, "isReLogin": false, "uuid": "", "fa": [["cn": "", "cv": "", "uniq": false]]], gtk: gtk)
            return try await loginResult(object, header: header, identifier: identifier, password: password)
        }
    }
    @objc func answerSecurity(_ call: CAPPluginCall) {
        run(call) { [self] in
            guard let state = pending, let choice = call.getString("choice") else { throw fail("La demande de sécurité a expiré. Recommence la connexion.") }
            let (result, response) = try await ed("connexion/doubleauth.awp?verbe=post", data: ["choix": choice], token: state["token"]!, twoFA: state["twoFA"]!)
            guard result["code"] as? Int == 200, let content = result["data"] as? [String: Any], let cn = content["cn"] as? String, let cv = content["cv"] as? String else { pending = nil; throw fail("Réponse refusée. Vérifie ton compte directement sur ÉcoleDirecte avant de réessayer.") }
            let gtk = (HTTPCookieStorage.shared.cookies(for: URL(string: api)!) ?? []).first { $0.name.uppercased() == "GTK" }?.value ?? ""
            let (object, header) = try await ed("login.awp", data: ["identifiant": state["identifier"]!, "motdepasse": state["password"]!, "isReLogin": false, "uuid": "", "fa": [["cn": cn, "cv": cv, "uniq": false]]], twoFA: response.value(forHTTPHeaderField: "2fa-token") ?? state["twoFA"]!, gtk: gtk)
            return try await loginResult(object, header: header, identifier: state["identifier"]!, password: state["password"]!)
        }
    }
    @objc func selectAccount(_ call: CAPPluginCall) {
        run(call) { [self] in
            var saved = try secureRead(); let id = call.getString("id") ?? ""
            guard let accounts = saved["accounts"] as? [[String: Any]], accounts.contains(where: { String(describing: $0["id"] ?? "") == id }) else { throw fail("Compte élève inconnu.") }
            saved["accountID"] = id; try secureSave(saved); return [:]
        }
    }
    @objc func refreshNotes(_ call: CAPPluginCall) {
        run(call) { [self] in
            var saved = try secureRead()
            guard let token = saved["token"] as? String, let id = saved["accountID"] as? String, id.range(of: "^[0-9]+$", options: .regularExpression) != nil else { throw fail("Choisis ton compte élève.") }
            let (result, _) = try await ed("eleves/" + id + "/notes.awp?verbe=get", data: ["anneeScolaire": ""], token: token)
            guard result["code"] as? Int == 200, let data = result["data"] as? [String: Any], data["periodes"] is [Any] else { throw fail("Impossible de récupérer les notes. Ta session peut avoir expiré : reconnecte-toi.") }
            if let renewed = result["token"] as? String { saved["token"] = renewed; try secureSave(saved) }
            let cache: [String: Any] = ["data": data, "accountID": id, "updated": ISO8601DateFormatter().string(from: Date())]
            try writePrivate(JSONSerialization.data(withJSONObject: cache), to: root.appendingPathComponent("private-notes.json"))
            return cache
        }
    }
    @objc func cachedNotes(_ call: CAPPluginCall) {
        run(call) { [self] in
            let url = root.appendingPathComponent("private-notes.json")
            if !fm.fileExists(atPath: url.path) { return ["empty": true] }
            return try json(Data(contentsOf: url))
        }
    }
    @objc func disconnect(_ call: CAPPluginCall) {
        pending = nil
        SecItemDelete([kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "fr.lilegyy.revisestl.ecoledirecte", kSecAttrAccount as String: "session"] as CFDictionary)
        try? fm.removeItem(at: root.appendingPathComponent("private-notes.json"))
        for cookie in HTTPCookieStorage.shared.cookies ?? [] where cookie.domain.hasSuffix("ecoledirecte.com") { HTTPCookieStorage.shared.deleteCookie(cookie) }
        call.resolve()
    }
}
