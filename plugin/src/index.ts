import { ConfigPlugin, withEntitlementsPlist, withXcodeProject, withInfoPlist } from '@expo/config-plugins'
import { ExpoConfig } from '@expo/config-types'
import assert from 'assert'
import * as jetpack from 'fs-jetpack'
import path from 'path'

export type ShareExtensionPluginProps = {
  devTeam: string
  extensionPath: string
  mainStoryboardName: string
  activationRule: string | string[]
  supportSuggestions?: boolean
  overrideDeploymentTarget?: string
  overrideSwiftVersion?: string
}

const PLUGIN_PATH = 'share-extension-expo-plugin'
const EXTENSION_TARGET_NAME = 'ShareExtension'

const ENTITLEMENTS_FILENAME = `${EXTENSION_TARGET_NAME}.entitlements`
const INFO_PLIST_FILENAME = `${EXTENSION_TARGET_NAME}-Info.plist`

const KEYCHAIN_HELPER_FILENAME = 'KeychainHelper.swift'

const DEFAULT_DEPLOYMENT_TARGET = '15.0'
const DEFAULT_SWIFT_VERSION = '5.7'

const REGEX_IDENTIFIER = /{{IDENTIFIER}}/gm
const REGEX_BUNDLE_SHORT_VERSION = /{{CFBundleShortVersionString}}/gm
const REGEX_BUNDLE_VERSION = /{{CFBundleVersion}}/gm
const REGEX_EXTENSION_ACTIVATION_RULE = /{{NSExtensionActivationRule}}/gm
const REGEX_EXTENSION_MAIN_STORYBOARD = /{{NSExtensionMainStoryboard}}/gm
const REGEX_SHARE_EXTENTION_KEYCHAIN_ACCESS_GROUP = /{{ShareExtensionKeychainAccessGroup}}/gm

function getKeychainAccessGroup(config: ExpoConfig): string {
  return `$(AppIdentifierPrefix)${config.ios!.bundleIdentifier!}`
}

const withShareExtension: ConfigPlugin<ShareExtensionPluginProps> = (config, pluginProps) => {
  assert(config.version, 'Missing {expo.version} in app config.')
  assert(config.ios?.bundleIdentifier, 'Missing {expo.ios.bundleIdentifier} in app config.')
  assert(config.ios?.buildNumber, 'Missing {expo.ios.buildNumber} in app config.')

  if (pluginProps.supportSuggestions) {
    config = withMessageIntent(config, pluginProps)
  }

  config = withKeychainSharing(config, pluginProps)
  config = withKeychainAccessGroup(config, pluginProps)
  config = withShareExtensionTarget(config, pluginProps)
  config = withEasManagedCredentials(config, pluginProps)
  return config
}

const withMessageIntent: ConfigPlugin<ShareExtensionPluginProps> = (config) => {
  return withInfoPlist(config, (props) => {
    if (!Array.isArray(props.modResults.NSUserActivityTypes)) {
      props.modResults.NSUserActivityTypes = []
    }

    if (!props.modResults.NSUserActivityTypes.includes('INSendMessageIntent')) {
      props.modResults.NSUserActivityTypes.push('INSendMessageIntent')
    }

    return props
  })
}

const withKeychainAccessGroup: ConfigPlugin<ShareExtensionPluginProps> = (config) => {
  return withInfoPlist(config, (props) => {
    props.modResults.ShareExtensionKeychainAccessGroup = getKeychainAccessGroup(config)
    return props
  })
}

const withKeychainSharing: ConfigPlugin<ShareExtensionPluginProps> = (config) => {
  return withEntitlementsPlist(config, (props) => {
    const KEYCHAIN_ACCESS_GROUP = 'keychain-access-groups'

    if (!Array.isArray(props.modResults[KEYCHAIN_ACCESS_GROUP])) {
      props.modResults[KEYCHAIN_ACCESS_GROUP] = []
    }

    const modResultsArray = props.modResults[KEYCHAIN_ACCESS_GROUP] as any[]

    const entitlement = getKeychainAccessGroup(config)

    if (modResultsArray.indexOf(entitlement) !== -1) {
      return props
    }

    modResultsArray.push(entitlement)
    return props
  })
}

const withShareExtensionTarget: ConfigPlugin<ShareExtensionPluginProps> = (config, pluginProps) => {
  return withXcodeProject(config, (config) => {
    let modulesPath = 'node_modules'
    for (let x = 0; x < 5 && !jetpack.exists(modulesPath); x++) {
      modulesPath = '../' + modulesPath
    }
    const source = `${modulesPath}/${PLUGIN_PATH}/plugin/assets/ios`
    const sourceExtension = `${modulesPath}/../${pluginProps.extensionPath}`
    const destination = `${config.modRequest.platformProjectRoot}/${EXTENSION_TARGET_NAME}`
    const xcodeProject = config.modResults

    const devTeam = pluginProps.devTeam
    const deploymentTarget = pluginProps?.overrideDeploymentTarget ?? DEFAULT_DEPLOYMENT_TARGET
    const swiftVersion = pluginProps.overrideSwiftVersion ?? DEFAULT_SWIFT_VERSION
    const deviceFamily = config.ios?.isTabletOnly ? '"2"' : config.ios?.supportsTablet ? '"1,2"' : '"1"'
    const bundleIdentifier = config.ios!.bundleIdentifier!
    const bundleVersion = config.ios!.buildNumber!
    const bundleShortVersion = config.version!
    const mainStoryboardName = pluginProps.mainStoryboardName

    let activationRule = ''
    if (typeof pluginProps.activationRule === 'string') {
      activationRule = pluginProps.activationRule as string
    } else {
      const rules = pluginProps.activationRule as string[]
      activationRule = `SUBQUERY ( \
          extensionItems, \
          $extensionItem, \
          SUBQUERY ( \
            $extensionItem.attachments, \
            $attachment, \
            (${rules
              .map((x) => `ANY $attachment.registeredTypeIdentifiers UTI-CONFORMS-TO "public.${x}"`)
              .join(' || ')})
          ).@count == 1 \
        ).@count == 1`
    }

    const sourceFiles = jetpack.find(sourceExtension, { matching: '*.swift' })
    const resourceFiles = jetpack.find(sourceExtension, { matching: '*.storyboard' })

    const allFiles = [
      `${source}/${ENTITLEMENTS_FILENAME}`,
      `${source}/${INFO_PLIST_FILENAME}`,
      `${modulesPath}/${PLUGIN_PATH}/ios/${KEYCHAIN_HELPER_FILENAME}`,
      ...sourceFiles,
      ...resourceFiles,
    ]

    // Copy assets into xcode project
    jetpack.dir(destination)
    allFiles.forEach((x) => jetpack.copy(x, `${destination}/${path.basename(x)}`))

    // Fix group identifier in entitlements
    const entitlementsPath = `${destination}/${ENTITLEMENTS_FILENAME}`
    let entitlementsFile = jetpack.read(entitlementsPath)!
    entitlementsFile = entitlementsFile.replace(REGEX_IDENTIFIER, bundleIdentifier)
    jetpack.write(entitlementsPath, entitlementsFile)

    // Fix missing data in info plist
    const infoPlistPath = `${destination}/${INFO_PLIST_FILENAME}`
    let infoPlistFile = jetpack.read(infoPlistPath)!
    infoPlistFile = infoPlistFile.replace(REGEX_BUNDLE_SHORT_VERSION, bundleShortVersion)
    infoPlistFile = infoPlistFile.replace(REGEX_BUNDLE_VERSION, bundleVersion)
    infoPlistFile = infoPlistFile.replace(REGEX_EXTENSION_MAIN_STORYBOARD, mainStoryboardName)
    infoPlistFile = infoPlistFile.replace(REGEX_EXTENSION_ACTIVATION_RULE, activationRule)
    infoPlistFile = infoPlistFile.replace(REGEX_SHARE_EXTENTION_KEYCHAIN_ACCESS_GROUP, getKeychainAccessGroup(config))
    jetpack.write(infoPlistPath, infoPlistFile)

    // Add assets in an xcode 'PBXGroup' (xcode folders)
    const allFilesNames = allFiles.map((x) => path.basename(x))
    const group = xcodeProject.addPbxGroup(allFilesNames, EXTENSION_TARGET_NAME, EXTENSION_TARGET_NAME)

    // Add the new PBXGroup to the top level group
    // This makes the folder appear in the file explorer in Xcode
    const groups = xcodeProject.hash.project.objects['PBXGroup']
    const rootKey = Object.keys(groups).find(
      (key) => !key.includes('comment') && groups[key].name === undefined && groups[key].path !== 'Pods'
    )
    xcodeProject.addToPbxGroup(group.uuid, rootKey)

    // WORK AROUND for xcodeProject.addTarget BUG
    // Xcode projects don't contain these if there is only one target
    // An upstream fix should be made to the code referenced in this link:
    // https://github.com/apache/cordova-node-xcode/blob/8b98cabc5978359db88dc9ff2d4c015cba40f150/lib/pbxProject.js#L860
    const projObjects = xcodeProject.hash.project.objects
    projObjects['PBXTargetDependency'] = projObjects['PBXTargetDependency'] || {}
    projObjects['PBXContainerItemProxy'] = projObjects['PBXTargetDependency'] || {}

    if (xcodeProject.pbxTargetByName(EXTENSION_TARGET_NAME)) {
      console.log(`${EXTENSION_TARGET_NAME} already exists in project. Skipping...`)
      return config
    }

    // Add the target
    // This adds PBXTargetDependency and PBXContainerItemProxy for you
    const target = xcodeProject.addTarget(
      EXTENSION_TARGET_NAME,
      'app_extension',
      EXTENSION_TARGET_NAME,
      `${bundleIdentifier}.${EXTENSION_TARGET_NAME}`
    )

    // Add build phases to the new target
    xcodeProject.addBuildPhase(
      [KEYCHAIN_HELPER_FILENAME, ...sourceFiles.map((x) => path.basename(x))],
      'PBXSourcesBuildPhase',
      'Sources',
      target.uuid
    )
    xcodeProject.addBuildPhase(
      resourceFiles.map((x) => path.basename(x)),
      'PBXResourcesBuildPhase',
      'Resources',
      target.uuid
    )

    // Edit build settings
    const configurations = xcodeProject.pbxXCBuildConfigurationSection()
    for (const key in configurations) {
      if (
        typeof configurations[key].buildSettings !== 'undefined' &&
        configurations[key].buildSettings.PRODUCT_NAME === `"${EXTENSION_TARGET_NAME}"`
      ) {
        const buildSettingsObj = configurations[key].buildSettings
        buildSettingsObj.DEVELOPMENT_TEAM = devTeam
        buildSettingsObj.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget
        buildSettingsObj.TARGETED_DEVICE_FAMILY = deviceFamily
        buildSettingsObj.CODE_SIGN_ENTITLEMENTS = `${EXTENSION_TARGET_NAME}/${ENTITLEMENTS_FILENAME}`
        buildSettingsObj.CODE_SIGN_STYLE = 'Automatic'
        buildSettingsObj.SWIFT_VERSION = swiftVersion
      }
    }

    // Add development teams to both your target and the original project
    xcodeProject.addTargetAttribute('DevelopmentTeam', devTeam, target)
    xcodeProject.addTargetAttribute('DevelopmentTeam', devTeam)

    jetpack.write(config.modResults.filepath, xcodeProject.writeSync())

    return config
  })
}

const withEasManagedCredentials: ConfigPlugin<ShareExtensionPluginProps> = (config) => {
  config.extra = {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      build: {
        ...config.extra?.eas?.build,
        experimental: {
          ...config.extra?.eas?.build?.experimental,
          ios: {
            ...config.extra?.eas?.build?.experimental?.ios,
            appExtensions: [
              ...(config.extra?.eas?.build?.experimental?.ios?.appExtensions ?? []),
              {
                targetName: EXTENSION_TARGET_NAME,
                bundleIdentifier: `${config.ios!.bundleIdentifier!}.${EXTENSION_TARGET_NAME}`,
                entitlements: {
                  'keychain-access-groups': [getKeychainAccessGroup(config)],
                },
              },
            ],
          },
        },
      },
    },
  }

  return config
}

export default withShareExtension
