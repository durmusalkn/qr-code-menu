import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * EAS project ID. Fill in once after running `eas init` (see README).
 * It is not a secret, so it is safe to commit.
 */
const EAS_PROJECT_ID = '';

/** `development` builds install side by side with `preview` builds. */
const IS_DEV = process.env.APP_VARIANT === 'development';

const BASE_ID = 'com.durmusalkn.anilar';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? 'Anılar (Dev)' : 'Anılar',
  slug: 'anilar',
  platforms: ['android', 'ios'],
  // Bump this whenever native config changes (new plugin, permission, native
  // dependency). It drives `runtimeVersion`, so OTA updates never reach a build
  // whose native code does not match.
  version: '0.3.0',
  runtimeVersion: { policy: 'appVersion' },
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: IS_DEV ? 'anilar-dev' : 'anilar',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: IS_DEV ? `${BASE_ID}.dev` : BASE_ID,
    supportsTablet: false,
  },
  android: {
    package: IS_DEV ? `${BASE_ID}.dev` : BASE_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // We only ever write to the gallery; never read it. Some libraries declare these in their own
    // manifests, so they are removed explicitly.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.ACCESS_MEDIA_LOCATION',
      // Added by the default template for dev overlays; not needed and frowned upon by stores.
      'android.permission.SYSTEM_ALERT_WINDOW',
    ],
  },
  // iOS permission texts are kept here because the config runs in Node, outside the app bundle.
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#171717',
      },
    ],
    [
      'expo-location',
      {
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        isIosBackgroundLocationEnabled: true,
        locationWhenInUsePermission: 'Anılarına bulunduğun yeri eklemek için konumunu kullanır.',
        locationAlwaysAndWhenInUsePermission:
          'Gün içinde gittiğin yerleri arka planda kaydetmek için konumunu kullanır.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission: 'Anı olarak fotoğraf ve video çekmek için kamerayı kullanır.',
        microphonePermission: 'Video çekerken sesi kaydetmek için mikrofonu kullanır.',
        photosPermission: false,
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission: 'Sesli anı kaydetmek için mikrofonu kullanır.',
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
      },
    ],
    [
      'expo-media-library',
      {
        // Write-only: no granular READ_MEDIA_* permissions.
        granularPermissions: [],
        isAccessMediaLocationEnabled: false,
        photosPermission: false,
        savePhotosPermission: 'Çektiğin fotoğrafların bir kopyasını galeriye kaydeder.',
      },
    ],
    [
      'expo-video',
      {
        supportsBackgroundPlayback: false,
        supportsPictureInPicture: false,
      },
    ],
    'expo-background-task',
    'react-native-zip-archive',
  ],
  experiments: {
    typedRoutes: true,
  },
  ...(EAS_PROJECT_ID
    ? {
        updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
        extra: { eas: { projectId: EAS_PROJECT_ID } },
      }
    : {}),
});
