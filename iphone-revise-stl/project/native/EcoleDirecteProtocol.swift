import Foundation

// Paramètres publics vérifiés dans le client ÉcoleDirecte et MoyennesED.
enum EcoleDirecteProtocol {
    static let version = "4.103.1"
    static let userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
    static func url(_ path: String) -> URL {
        var value = URLComponents(string: "https://api.ecoledirecte.com/v3/" + path)!
        var items = value.queryItems ?? []
        items.removeAll { $0.name == "v" }
        items.append(URLQueryItem(name: "v", value: version))
        value.queryItems = items
        return value.url!
    }
    static func encodeCredential(_ value: String) -> String {
        let allowed = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()")
        return value.addingPercentEncoding(withAllowedCharacters: allowed)!
    }
    static func body(_ values: [String: Any]) throws -> Data {
        var encoded = values
        for key in ["identifiant", "motdepasse"] {
            if let value = values[key] as? String { encoded[key] = encodeCredential(value) }
        }
        // Le serveur attend data suivi du JSON, pas un JSON intégralement percent-encodé.
        let data = try JSONSerialization.data(withJSONObject: encoded, options: [.sortedKeys, .withoutEscapingSlashes])
        let text = String(data: data, encoding: .utf8)!.replacingOccurrences(of: "&", with: "%26").replacingOccurrences(of: "+", with: "%2B")
        return Data(("data=" + text).utf8)
    }
}
