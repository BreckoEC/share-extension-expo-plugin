import ExpoModulesCore
import Foundation

public class ShareExtensionNativeModule: Module {
  var group: String?

  public func definition() -> ModuleDefinition {
    Name("ShareExtensionNative")

    OnCreate {
      group = (Bundle.main.object(forInfoDictionaryKey: "ShareExtensionKeychainAccessGroup") as? String)!
    }

    Function("getKeychainValue") { (key: String) -> String? in
      return KeychainHelper.getValue(forKey: key, inGroup: group!)
    }

    Function("setKeychainValue") { (key: String, value: String) -> Void in
      KeychainHelper.setValue(value, forKey: key, inGroup: group!)
    }

    Function("removeKeychainValue") { (key: String) -> Void in
      KeychainHelper.removeValue(forKey: key, inGroup: group!)
    }

    Function("sendMessageIntent") { (recipients: [User], sender: User, conversationId: String, groupName: String?, groupPicture: String?) -> Void in
      IntentsHelper.sendMessage(to: recipients, from: sender, in: conversationId, groupName: groupName, groupPicture: groupPicture)
    }
  }
}
