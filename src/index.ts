import ShareExtensionNativeModule from './ShareExtensionNativeModule'
import { RecordUser } from './types'

export function getKeychainValue(key: string): string {
  return ShareExtensionNativeModule.getKeychainValue(key)
}

export function setKeychainValue(key: string, value: string): void {
  ShareExtensionNativeModule.setKeychainValue(key, value)
}

export function removeKeychainValue(key: string): void {
  ShareExtensionNativeModule.removeKeychainValue(key)
}

export function sendMessageIntent(
  recipients: RecordUser[],
  sender: RecordUser,
  conversationId: string,
  groupName?: string,
  groupPicture?: string
): void {
  ShareExtensionNativeModule.sendMessageIntent(recipients, sender, conversationId, groupName, groupPicture)
}

export { RecordUser }
