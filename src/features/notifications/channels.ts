import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { tr } from '@/i18n/tr';

/**
 * Android notification channels. A channel's importance cannot be changed after it is created,
 * so changing it later means introducing a new channel id.
 */
export const NOTIFICATION_CHANNELS = {
  prompts: 'prompts',
} as const;

/** Must run before asking for notification permission: Android 13+ shows no prompt without a channel. */
export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.prompts, {
    name: tr.notifications.channels.prompts,
    importance: Notifications.AndroidImportance.HIGH,
  });
}
