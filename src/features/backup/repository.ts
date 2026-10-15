import { desc, eq } from 'drizzle-orm';

import { defaultDeps, type RepositoryDeps } from '@/db/deps';
import { backupLog, type BackupLogEntry } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export interface BackupResult {
  filesCopied: number;
  bytesCopied: number;
}

export function createBackupLogRepository(db: AppDatabase, deps: RepositoryDeps = defaultDeps) {
  function finish(id: string, fields: Partial<BackupLogEntry>): BackupLogEntry | undefined {
    return db
      .update(backupLog)
      .set({ ...fields, finishedAt: deps.now() })
      .where(eq(backupLog.id, id))
      .returning()
      .get();
  }

  return {
    start(): BackupLogEntry {
      return db
        .insert(backupLog)
        .values({ id: deps.newId(), startedAt: deps.now(), status: 'running' })
        .returning()
        .get();
    },

    succeed(id: string, result: BackupResult): BackupLogEntry | undefined {
      return finish(id, { status: 'success', error: null, ...result });
    },

    fail(
      id: string,
      error: string,
      partial: Partial<BackupResult> = {},
    ): BackupLogEntry | undefined {
      return finish(id, { status: 'error', error, ...partial });
    },

    latest(): BackupLogEntry | undefined {
      return db.select().from(backupLog).orderBy(desc(backupLog.startedAt)).limit(1).get();
    },

    latestSuccessful(): BackupLogEntry | undefined {
      return db
        .select()
        .from(backupLog)
        .where(eq(backupLog.status, 'success'))
        .orderBy(desc(backupLog.startedAt))
        .limit(1)
        .get();
    },
  };
}

export type BackupLogRepository = ReturnType<typeof createBackupLogRepository>;
