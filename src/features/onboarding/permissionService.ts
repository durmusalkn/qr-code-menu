/**
 * Reads, requests and opens settings for every permission the app needs. All native calls for
 * permissions are confined to this module.
 */
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { isBatteryOptimizationEnabledAsync } from 'expo-battery';
import Constants from 'expo-constants';
import { Directory } from 'expo-file-system';
import { getCameraPermissionsAsync, requestCameraPermissionsAsync } from 'expo-image-picker';
import { ActivityAction, startActivityAsync } from 'expo-intent-launcher';
import {
  getBackgroundPermissionsAsync,
  getForegroundPermissionsAsync,
  requestBackgroundPermissionsAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { db } from '@/db/client';
import { ensureNotificationChannels } from '@/features/notifications/channels';
import { createSettingsRepository } from '@/features/settings/repository';

import {
  PERMISSION_KEYS,
  fromLocationResponse,
  fromPermissionResponse,
  type PermissionKey,
  type PermissionState,
  type PermissionStatuses,
} from './permissions';

const settings = createSettingsRepository(db);

/** Suggested starting point for the folder picker: the shared Documents folder. */
const DOCUMENTS_TREE_URI =
  'content://com.android.externalstorage.documents/document/primary%3ADocuments';

function packageName(): string | undefined {
  return Constants.expoConfig?.android?.package;
}

async function backupFolderState(): Promise<PermissionState> {
  const uri = settings.get('backupDirectoryUri');
  if (!uri) return 'undetermined';
  try {
    return new Directory(uri).exists ? 'granted' : 'denied';
  } catch {
    // The persisted grant was revoked or the folder was deleted.
    return 'denied';
  }
}

async function batteryState(): Promise<PermissionState> {
  if (Platform.OS !== 'android') return 'granted';
  try {
    return (await isBatteryOptimizationEnabledAsync()) ? 'denied' : 'granted';
  } catch {
    return 'unknown';
  }
}

const readers: Record<PermissionKey, () => Promise<PermissionState>> = {
  notifications: async () => fromPermissionResponse(await Notifications.getPermissionsAsync()),
  location: async () => fromLocationResponse(await getForegroundPermissionsAsync()),
  backgroundLocation: async () => fromPermissionResponse(await getBackgroundPermissionsAsync()),
  camera: async () => fromPermissionResponse(await getCameraPermissionsAsync()),
  microphone: async () => fromPermissionResponse(await getRecordingPermissionsAsync()),
  batteryOptimization: batteryState,
  backupFolder: backupFolderState,
};

export async function getPermissionState(key: PermissionKey): Promise<PermissionState> {
  try {
    return await readers[key]();
  } catch {
    return 'unknown';
  }
}

export async function getPermissionStatuses(): Promise<PermissionStatuses> {
  const states = await Promise.all(PERMISSION_KEYS.map(getPermissionState));
  return Object.fromEntries(
    PERMISSION_KEYS.map((key, i) => [key, states[i]]),
  ) as PermissionStatuses;
}

/**
 * Shows the system permission dialog. For background location on Android 11+ the system opens
 * the app's location settings page instead, where "Allow all the time" must be picked.
 */
export async function requestPermission(key: PermissionKey): Promise<PermissionState> {
  switch (key) {
    case 'notifications':
      await ensureNotificationChannels();
      return fromPermissionResponse(await Notifications.requestPermissionsAsync());
    case 'location':
      return fromLocationResponse(await requestForegroundPermissionsAsync());
    case 'backgroundLocation':
      return fromPermissionResponse(await requestBackgroundPermissionsAsync());
    case 'camera':
      return fromPermissionResponse(await requestCameraPermissionsAsync());
    case 'microphone':
      return fromPermissionResponse(await requestRecordingPermissionsAsync());
    case 'batteryOptimization':
    case 'backupFolder':
      return getPermissionState(key);
  }
}

/** Opens the most specific system settings screen for the permission. */
export async function openPermissionSettings(key: PermissionKey): Promise<void> {
  const pkg = packageName();
  if (Platform.OS === 'android') {
    try {
      if (key === 'notifications' && pkg) {
        await startActivityAsync(ActivityAction.APP_NOTIFICATION_SETTINGS, {
          extra: { 'android.provider.extra.APP_PACKAGE': pkg },
        });
        return;
      }
      if (key === 'batteryOptimization') {
        // The direct "allow" dialog needs REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, which stores
        // restrict; the list screen needs no permission.
        await startActivityAsync(ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        return;
      }
    } catch {
      // Fall through to the app details page.
    }
  }
  await Linking.openSettings();
}

/**
 * Lets the user pick the backup folder (Storage Access Framework). The grant is persisted by
 * expo-file-system, so background backups keep working after a restart. Returns the folder URI,
 * or null if the user cancelled.
 */
export async function pickBackupFolder(): Promise<string | null> {
  try {
    const directory = await Directory.pickDirectoryAsync(
      Platform.OS === 'android' ? DOCUMENTS_TREE_URI : undefined,
    );
    settings.set('backupDirectoryUri', directory.uri);
    return directory.uri;
  } catch {
    return null;
  }
}
