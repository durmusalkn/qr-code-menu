import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';

import { db } from './client';
import migrations from './migrations.generated';

let pending: Promise<void> | null = null;

/**
 * Applies pending migrations once per JS runtime. Safe to call from the UI and from background
 * tasks, which may start the runtime without the UI.
 */
export function migrateDatabase(): Promise<void> {
  pending ??= migrate(db, migrations).catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

export type DatabaseStatus =
  { state: 'migrating' } | { state: 'ready' } | { state: 'error'; error: Error };

export function useDatabase(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>({ state: 'migrating' });

  useEffect(() => {
    let cancelled = false;
    migrateDatabase().then(
      () => !cancelled && setStatus({ state: 'ready' }),
      (error: unknown) =>
        !cancelled &&
        setStatus({
          state: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
