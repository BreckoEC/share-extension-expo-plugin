<h1 align="center">Welcome to share-extension-expo-plugin 👋</h1>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/BreckoEC/share-extension-expo-plugin?label=Version&logo=github" />
  <img src="https://img.shields.io/github/release-date/BreckoEC/share-extension-expo-plugin?label=Released&logo=github" />
  <img src="https://img.shields.io/github/license/BreckoEC/share-extension-expo-plugin?label=Licence&logo=github" />
  <img src="https://img.shields.io/github/issues/BreckoEC/share-extension-expo-plugin?label=Issues&logo=github" />
  <img src="https://img.shields.io/github/issues-pr/BreckoEC/share-extension-expo-plugin?label=Pull%20Requests&logo=github" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS-violet?logo=apple" />
</p>

<p align="center">
  <a href="https://www.linkedin.com/in/etiennecunin/">
    <img src="https://img.shields.io/badge/LinkedIn-Freelance-green.svg?logo=linkedin" />
  </a>
  <a href="https://paypal.me/BreckoEC">
    <img src="https://img.shields.io/badge/PayPal-donate-00457c.svg?logo=paypal" />
  </a>
  <a href="https://ko-fi.com/A0A4J36YF">
    <img src="https://img.shields.io/badge/Ko--fi-donate-red?logo=kofi" />
  </a>
</p>

> The Share Extension Expo plugin allows your app to be suggested in the iOS share sheet without leaving the expo managed workflow.<br />
> The iOS share extension is a specific app extension that allows your app to be shown in the iOS share sheet.

<p align="center">
  <img src="https://help.apple.com/assets/6387F6CB0C1E2145A22E8306/6387F6E80C1E2145A22E8333/fr_FR/06ecde2f83face7060321bdca74fe396.png" alt="share sheet" width="" height="400">
</p>

## 🎁 What's inside ?

This package is composed from:
- a native module available from javascript to:
  - manipulate the [keychain](https://developer.apple.com/documentation/security/keychain_services/keychain_items/sharing_access_to_keychain_items_among_a_collection_of_apps)
 _(a data container shared by your app and the share extension)_
  - send [message intents](https://developer.apple.com/documentation/foundation/app_extension_support/supporting_suggestions_in_your_app_s_share_extension#3362244) _(increment suggestion counter in iOS system)_
- an [expo plugin](https://docs.expo.dev/guides/config-plugins/) that:
  - enables [keychain sharing](https://developer.apple.com/documentation/xcode/configuring-keychain-sharing) support for your app
  - adds _(optional)_ [INSendMessageIntent](https://developer.apple.com/documentation/sirikit/insendmessageintent) to the list of supported user activities
  - copies your extension files in xcode
  - adds and configures the iOS Share Extension

> This means you still have to develop the share extension in XCode (using swift) and this plugin will copy the files in the generated xcode project + configure the share extension using your files

## 🛠️ Installation

Add the package to your dependencies

```
expo install share-extension-expo-plugin
```

## ⚙️ Configuration

Open your `app.config.json` or `app.json` and configure the following

### Required config properties

Make sure to provide `version`, `ios.bundleIdentifier` and `ios.buildNumber` in your `app.config.js` or `app.json` for the plugin to work. Otherwise, you should have an error on build.

```js
{
  ...
  "version": "0.0.1",
  "ios": {
    "bundleIdentifier": "com.example.MyApp",
    "buildNumber": "1", // can be set automatically by expo
    ...
  },
  ...
}
```

### Plugin Properties

Add this plugin to your `plugins` array and use the array below to setup plugin props.

```js
{
  ...
  "plugins": [
    ...
    [
      "share-extension-expo-plugin",
      {
        "devTeam": "XXXXXXXXXX",
        "extensionPath": "path/to/your/extension/files",
        "mainStoryboardName": "MainStoryboard",
        "activationRule": ["url", "image", "movie"]
        // ... check configuration below for more info
      }
    ]
    ...
  ]
  ...
}
```

| Plugin Prop | | |
| --- | --- | --- |
| `devTeam` | **required** | Used to configure Apple Team ID. You can find your Apple Team ID by running `expo credentials:manager` e.g: `"91SW8A37CR"` |
| `extensionPath` | **required** | Path from this module to your extension files (swift sources, storyboards, ...) e.g: `../assets/ios/shareExtension` |
| `mainStoryboardName` | **required** | Used to configure the [NSExtensionMainStoryboard](https://developer.apple.com/documentation/bundleresources/information_property_list/nsextension/nsextensionmainstoryboard) entry in extension `Info.plist` e.g: `MainStoryboard` |
| `activationRule` | **required** | Used to configure the [NSExtensionActivationRule](https://developer.apple.com/documentation/bundleresources/information_property_list/nsextension/nsextensionattributes/nsextensionactivationrule) entry in extension `Info.plist`. It can be either a string, in the [apple string predicate format](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Predicates/Articles/pSyntax.html) or an array of string containing type identifiers (without `public.`) e.g: `['text', 'url', 'image', 'movie']` |
| `supportSuggestions` | _optional_ | default: `false`. Set this to true to enable [suggestions](https://developer.apple.com/documentation/foundation/app_extension_support/supporting_suggestions_in_your_app_s_share_extension#3362244) |
| `overrideDeploymentTarget` | _optional_ | default: `15.0`. Override this if your app targets a higher iOS version. |
| `overrideSwiftVersion` | _optional_ | default: `5.7`. Override this if your swift extension code has been created with a higher swift version |

## 🔑 Credentials

Like every other iOS app extensions, you will need Apple credentials for your share extension.
If you use EAS to handle your credentials, it will automatically be handled. Otherwise, you will have to configure everything on your apple developer account and on your expo project config.

## 📚 Documentation

```js
import {
  getKeychainValue,
  setKeychainValue,
  removeKeychainValue,
  sendMessageIntent,
  RecordUser,
} from 'share-extension-expo-plugin'

function example() {
  // read a keychain entry
  const token = getKeychainValue('token')

  // write a keychain entry
  setKeychainValue('token', 'eyJhbGciOiJIUzI1NiIsIn...')

  // erase a keychain entry
  removeKeychainValue('token')

  // increment suggestion counter
  const recipient: RecordUser = {
    id: '0001',
    name: 'Etienne',
    email: 'etienne@example.com',
    picture: 'https://www.gravatar.com/avatar/6ed6da5f61da2e30d23693bf7c612bd4',
  }
  const sender: RecordUser = {
    ...recipient,
    id: '0002',
  }
  const conversationId = '0000'
  const optionalGroupName = 'Etienne Etienne'
  const optionalGroupPicture = 'https://www.gravatar.com/avatar/6ed6da5f61da2e30d23693bf7c612bd4'
  sendMessageIntent(
    [recipient],
    sender,
    conversationId,
    optionalGroupName,
    optionalGroupPicture
  )
}
```

## 👀 Example

TODO
_(I am currently doing another repo to give an example of how to use this... WIP)_

## 🍰 Contributing

Feel free to contribute, report issues or open pull requests.

## 🙏 Patrons

Special thanks to the company that made this possible: [uKu](https://github.com/ukuteam)

## 📝 License

Copyright © 2023 [BreckoEC](https://github.com/BreckoEC/
)<br />
This project is [MIT](https://github.com/BreckoEC/share-extension-expo-plugin/blob/main/LICENSE) licensed.

<hr>
<p align="center"><i>Developed with ❤️ from France 🇫🇷</i></p>
