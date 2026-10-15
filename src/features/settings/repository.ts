import { eq } from 'drizzle-orm';

import { settings as settingsTable } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

import {
  SETTING_KEYS,
  decodeSetting,
  isSettingKey,
  isValidSetting,
  type SettingKey,
  type Settings,
} from './definitions';

export function createSettingsRepository(db: AppDatabase) {
  return {
    get<K extends SettingKey>(key: K): Settings[K] {
      const row = db.select().from(settingsTable).where(eq(settingsTable.key, key)).get();
      return decodeSetting(key, row?.value);
    },

    getAll(): Settings {
      const stored = new Map(
        db
          .select()
          .from(settingsTable)
          .all()
          .map((row) => [row.key, row.value]),
      );
      const result: Partial<Record<SettingKey, unknown>> = {};
      for (const key of SETTING_KEYS) {
        result[key] = decodeSetting(key, stored.get(key));
      }
      return result as Settings;
    },

    set<K extends SettingKey>(key: K, value: Settings[K]): void {
      if (!isSettingKey(key) || !isValidSetting(key, value)) {
        throw new Error(`Invalid value for setting ${key}: ${JSON.stringify(value)}`);
      }
      const json = JSON.stringify(value);
      db.insert(settingsTable)
        .values({ key, value: json })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: json } })
        .run();
    },

    /** Removes the stored value so the default applies again. */
    reset(key: SettingKey): void {
      db.delete(settingsTable).where(eq(settingsTable.key, key)).run();
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
