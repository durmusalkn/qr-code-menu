import { settings } from '@/db/schema';
import { createTestDatabase, type TestDatabase } from '@/db/testing/createTestDatabase';
import { decodeSetting, type Settings } from '@/features/settings/definitions';
import { createSettingsRepository, type SettingsRepository } from '@/features/settings/repository';

describe('decodeSetting', () => {
  it('falls back to the default for missing, malformed or invalid values', () => {
    expect(decodeSetting('promptsPerDay', undefined)).toBe(3);
    expect(decodeSetting('promptsPerDay', 'not json')).toBe(3);
    expect(decodeSetting('promptsPerDay', '"5"')).toBe(3);
    expect(decodeSetting('promptsPerDay', '2.5')).toBe(3);
    expect(decodeSetting('promptsPerDay', '5')).toBe(5);
    expect(decodeSetting('backupDirectoryUri', 'null')).toBeNull();
    expect(decodeSetting('backupDirectoryUri', '"content://x"')).toBe('content://x');
  });
});

describe('settings repository', () => {
  let t: TestDatabase;
  let repo: SettingsRepository;

  beforeEach(async () => {
    t = await createTestDatabase();
    repo = createSettingsRepository(t.db);
  });

  afterEach(() => t.raw.close());

  it('returns the agreed defaults on a fresh install', () => {
    expect(repo.getAll()).toEqual<Settings>({
      promptWindowStartHour: 10,
      promptWindowEndHour: 22,
      promptsPerDay: 3,
      recallReminderEnabled: true,
      onboardingCompleted: false,
      galleryAlbumId: null,
      backupDirectoryUri: null,
    });
  });

  it('persists values as JSON and overwrites them', () => {
    repo.set('recallReminderEnabled', false);
    repo.set('promptWindowStartHour', 9);
    repo.set('promptWindowStartHour', 11);

    expect(repo.get('recallReminderEnabled')).toBe(false);
    expect(repo.get('promptWindowStartHour')).toBe(11);
    expect(t.db.select().from(settings).all()).toHaveLength(2);
  });

  it('refuses invalid values', () => {
    expect(() => repo.set('promptWindowStartHour', 25)).toThrow();
    expect(() => repo.set('promptsPerDay', -1)).toThrow();
    expect(repo.get('promptsPerDay')).toBe(3);
  });

  it('resets to the default', () => {
    repo.set('promptsPerDay', 5);
    repo.reset('promptsPerDay');

    expect(repo.get('promptsPerDay')).toBe(3);
  });
});
