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
  version: '0.1.0',
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
    // We only ever write to the gallery; never read it.
    blockedPermissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    ],
  },
  plugins: ['expo-router'],
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
