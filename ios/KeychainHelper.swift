import Foundation

/**
 This class is used to share data with the main app
 */
struct KeychainHelper {
  private static let group = (Bundle.main.object(forInfoDictionaryKey: "ShareExtensionKeychainAccessGroup") as? String)!

  static func getValue(forKey key: String) -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrAccessGroup as String: group,
      kSecReturnData as String: true,
      kSecReturnAttributes as String: true,
      kSecMatchLimit as String: kSecMatchLimitOne,
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    guard status == errSecSuccess,
          let existingItem = item as? [String : AnyObject],
          let itemData = existingItem[kSecValueData as String] as? Data,
          let result = String(data: itemData, encoding: .utf8)
    else {
      return nil
    }
    
    return result
  }

  static func setValue(_ value: String, forKey key: String) {
    removeValue(forKey: key)

    let valueData = value.data(using: .utf8)
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrAccessGroup as String: group,
      kSecValueData as String: valueData as Any,
      kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlocked
    ]

    SecItemAdd(query as CFDictionary, nil)
  }

  static func removeValue(forKey key: String) {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrAccount as String: key,
      kSecAttrAccessGroup as String: group
    ]

    SecItemDelete(query as CFDictionary)
  }
}
