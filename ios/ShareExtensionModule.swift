import ExpoModulesCore
import Foundation

public class ShareExtensionNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ShareExtensionNative")

    Function("getKeychainValue") { (key: String) -> String? in
      return KeychainHelper.getValue(forKey: key)
    }

    Function("setKeychainValue") { (key: String, value: String) -> Void in
      KeychainHelper.setValue(value, forKey: key)
    }

    Function("removeKeychainValue") { (key: String) -> Void in
      KeychainHelper.removeValue(forKey: key)
    }

    Function("sendMessageIntent") { (recipients: [User], sender: User, conversationId: String, groupName: String?, groupPicture: String?) -> Void in
      IntentsHelper.sendMessage(to: recipients, from: sender, in: conversationId, groupName: groupName, groupPicture: groupPicture)
    }
  }
}
