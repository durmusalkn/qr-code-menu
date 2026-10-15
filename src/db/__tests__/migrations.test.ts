import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '@/db/migrations.generated';
import { moments } from '@/db/schema';
import { createTestDatabase } from '@/db/testing/createTestDatabase';
import { makeTempDatabasePath } from '@/db/testing/nodeSqliteConnection';

const TABLES = [
  'backup_log',
  'location_points',
  'media',
  'moments',
  'prompts',
  'settings',
  'visits',
];

describe('migrations', () => {
  it('creates every table', async () => {
    const { raw } = await createTestDatabase();

    const rows = raw.all(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name",
    ) as { name: string }[];

    expect(rows.map((r) => r.name)).toEqual(TABLES);
    raw.close();
  });

  it('indexes the time columns', async () => {
    const { raw } = await createTestDatabase();

    const indexes = (
      raw.all("SELECT name FROM sqlite_master WHERE type = 'index'") as { name: string }[]
    ).map((r) => r.name);

    expect(indexes).toEqual(
      expect.arrayContaining([
        'moments_created_at_idx',
        'media_created_at_idx',
        'location_points_recorded_at_idx',
        'visits_arrived_at_idx',
        'prompts_scheduled_for_idx',
        'backup_log_started_at_idx',
      ]),
    );
    raw.close();
  });

  it('keeps data when the app starts again and migrations re-run', async () => {
    const path = makeTempDatabasePath();
    const first = await createTestDatabase(path);
    first.db
      .insert(moments)
      .values({ id: 'm1', createdAt: 1, updatedAt: 1, source: 'in_app', note: 'merhaba' })
      .run();
    first.raw.close();

    const second = await createTestDatabase(path);
    await expect(migrate(second.db, migrations)).resolves.toBeUndefined();

    expect(second.db.select().from(moments).all()).toHaveLength(1);
    second.raw.close();
  });

  it('uses WAL journaling and enforces foreign keys', async () => {
    const { db, raw } = await createTestDatabase(makeTempDatabasePath());

    expect(db.get(sql`PRAGMA journal_mode`)).toEqual({ journal_mode: 'wal' });
    expect(db.get(sql`PRAGMA foreign_keys`)).toEqual({ foreign_keys: 1 });
    raw.close();
  });
});
