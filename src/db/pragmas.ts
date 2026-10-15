/**
 * Applied to every connection right after it is opened.
 *
 * - WAL lets background tasks write while the UI reads, and keeps `VACUUM INTO` backups cheap.
 * - Foreign keys are off by default in SQLite; media rows rely on ON DELETE CASCADE.
 * - busy_timeout avoids immediate SQLITE_BUSY errors when a background task holds the write lock.
 */
export const CONNECTION_PRAGMAS = [
  'PRAGMA journal_mode = WAL;',
  'PRAGMA foreign_keys = ON;',
  'PRAGMA busy_timeout = 5000;',
].join('\n');
