import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

import {
  getPermissionStatuses,
  openPermissionSettings,
  pickBackupFolder,
  requestPermission,
} from './permissionService';
import { permissionAction, type PermissionKey, type PermissionStatuses } from './permissions';

interface PermissionStore {
  statuses: PermissionStatuses | null;
  refresh(): Promise<void>;
  /** Performs the tap action for a permission (dialog, settings or folder picker), then refreshes. */
  resolve(key: PermissionKey): Promise<void>;
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  statuses: null,

  async refresh() {
    set({ statuses: await getPermissionStatuses() });
  },

  async resolve(key) {
    const current = get().statuses?.[key] ?? 'undetermined';
    switch (permissionAction(key, current)) {
      case 'request':
        await requestPermission(key);
        break;
      case 'openSettings':
        // The new state is picked up when the app becomes active again.
        await openPermissionSettings(key);
        break;
      case 'pickFolder':
        await pickBackupFolder();
        break;
    }
    await get().refresh();
  },
}));

/**
 * Current permission statuses, re-read on mount and whenever the app returns to the foreground
 * (e.g. after the user changed something in system settings). `null` until the first read.
 */
export function usePermissionStatuses(): PermissionStatuses | null {
  const statuses = usePermissionStore((s) => s.statuses);
  const refresh = usePermissionStore((s) => s.refresh);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return statuses;
}
