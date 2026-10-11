import Foundation

@main struct EDProtocolCheck {
    static func main() async throws {
        let url = EcoleDirecteProtocol.url("connexion/doubleauth.awp?verbe=post")
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)!.queryItems!
        precondition(items.contains { $0.name == "verbe" && $0.value == "post" })
        precondition(items.contains { $0.name == "v" && $0.value == "4.103.1" })
        let data = try EcoleDirecteProtocol.body(["identifiant": "élève +&", "motdepasse": "a+b&c%=é", "isReLogin": false, "fa": [["cn": "", "cv": "", "uniq": false]]])
        let text = String(data: data, encoding: .utf8)!
        precondition(text.hasPrefix("data={"))
        let parsed = try JSONSerialization.jsonObject(with: Data(text.dropFirst(5).utf8)) as! [String: Any]
        precondition(parsed["identifiant"] as? String == "%C3%A9l%C3%A8ve%20%2B%26")
        precondition(parsed["motdepasse"] as? String == "a%2Bb%26c%25%3D%C3%A9")
        precondition(parsed["isReLogin"] as? Bool == false)
        let challenge = String(data: try EcoleDirecteProtocol.body(["choix": "a+b/c=="]), encoding: .utf8)!
        precondition(challenge.contains("a%2Bb/c=="))
        print("Protocole Swift : URL versionnée, identifiants Unicode et caractères réservés, JSON brut, réponse de sécurité validés.")
        // Sonde anonyme : aucune connexion, aucun identifiant, aucun cookie publié.
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 12
        config.timeoutIntervalForResource = 15
        let session = URLSession(configuration: config)
        var request = URLRequest(url: EcoleDirecteProtocol.url("login.awp?gtk=1"))
        request.setValue(EcoleDirecteProtocol.userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue("https://www.ecoledirecte.com", forHTTPHeaderField: "Origin")
        request.setValue("https://www.ecoledirecte.com/", forHTTPHeaderField: "Referer")
        request.setValue("application/json, text/plain, */*", forHTTPHeaderField: "Accept")
        do {
            let (_, raw) = try await session.data(for: request)
            let response = raw as! HTTPURLResponse
            let hasGtk = response.value(forHTTPHeaderField: "Set-Cookie")?.uppercased().contains("GTK=") == true
            print("Sonde anonyme ÉcoleDirecte : HTTP \(response.statusCode), cookie GTK présent : \(hasGtk).")
        } catch {
            print("Sonde anonyme ÉcoleDirecte indisponible sur le Mac GitHub (code \((error as NSError).code)). Cela ne valide pas une connexion réelle sur iPhone.")
        }
        session.invalidateAndCancel()
    }
}
