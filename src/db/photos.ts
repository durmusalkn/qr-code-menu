import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayKey } from '../lib/dates';

export const DATABASE_NAME = 'progress.db';

export type Photo = {
  id: number;
  /** The day the photo belongs to, chosen when it was added. */
  day: DayKey;
  /** File name inside the app's photo directory. */
  fileName: string;
  width: number | null;
  height: number | null;
  createdAt: number;
};

type PhotoRow = {
  id: number;
  day: string;
  file_name: string;
  width: number | null;
  height: number | null;
  created_at: number;
};

const MIGRATIONS: string[] = [
  `
  CREATE TABLE photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    file_name TEXT NOT NULL UNIQUE,
    width INTEGER,
    height INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_photos_day ON photos (day);
  `,
];

/** Brings the schema up to date, tracking the applied version in `PRAGMA user_version`. */
export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    version++;
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(sql);
      await txn.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}

const toPhoto = (row: PhotoRow): Photo => ({
  id: row.id,
  day: row.day,
  fileName: row.file_name,
  width: row.width,
  height: row.height,
  createdAt: row.created_at,
});

export async function listPhotos(db: SQLiteDatabase): Promise<Photo[]> {
  const rows = await db.getAllAsync<PhotoRow>('SELECT * FROM photos ORDER BY day ASC, id ASC');
  return rows.map(toPhoto);
}

export async function insertPhoto(
  db: SQLiteDatabase,
  photo: { day: DayKey; fileName: string; width: number | null; height: number | null }
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO photos (day, file_name, width, height, created_at) VALUES (?, ?, ?, ?, ?)',
    photo.day,
    photo.fileName,
    photo.width,
    photo.height,
    Date.now()
  );
  return result.lastInsertRowId;
}

export async function updatePhotoDay(db: SQLiteDatabase, id: number, day: DayKey): Promise<void> {
  await db.runAsync('UPDATE photos SET day = ? WHERE id = ?', day, id);
}

export async function deletePhotoRow(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM photos WHERE id = ?', id);
}
