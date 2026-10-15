/**
 * Every persisted setting with its default and validator. Values are stored as JSON in the
 * `settings` table; anything missing or invalid falls back to the default.
 */
function isIntegerBetween(min: number, max: number) {
  return (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export const SETTING_DEFINITIONS = {
  /** First hour (local) in which random prompts may fire. */
  promptWindowStartHour: { default: 10, validate: isIntegerBetween(0, 23) },
  /** Prompts fire before this hour (local). */
  promptWindowEndHour: { default: 22, validate: isIntegerBetween(1, 24) },
  promptsPerDay: { default: 3, validate: isIntegerBetween(0, 10) },
  recallReminderEnabled: { default: true, validate: isBoolean },
  /** SAF directory URI picked during onboarding. */
  backupDirectoryUri: { default: null as string | null, validate: isNullableString },
} as const;

type Definitions = typeof SETTING_DEFINITIONS;

export type SettingKey = keyof Definitions;

export type Settings = {
  [K in SettingKey]: Definitions[K]['validate'] extends (value: unknown) => value is infer T
    ? T
    : never;
};

export const SETTING_KEYS = Object.keys(SETTING_DEFINITIONS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTING_DEFINITIONS, key);
}

export function defaultSetting<K extends SettingKey>(key: K): Settings[K] {
  return SETTING_DEFINITIONS[key].default as Settings[K];
}

export function isValidSetting<K extends SettingKey>(key: K, value: unknown): value is Settings[K] {
  return SETTING_DEFINITIONS[key].validate(value);
}

/** Parses a stored JSON value; returns the default when it is missing, malformed or invalid. */
export function decodeSetting<K extends SettingKey>(
  key: K,
  stored: string | undefined,
): Settings[K] {
  if (stored === undefined) return defaultSetting(key);
  try {
    const value: unknown = JSON.parse(stored);
    return isValidSetting(key, value) ? value : defaultSetting(key);
  } catch {
    return defaultSetting(key);
  }
}
