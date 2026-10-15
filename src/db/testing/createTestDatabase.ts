import { drizzle } from 'drizzle-orm/expo-sqlite/driver';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../migrations.generated';
import { CONNECTION_PRAGMAS } from '../pragmas';
import * as schema from '../schema';
import type { AppDatabase } from '../types';
import { openNodeSqliteConnection, type NodeSqliteConnection } from './nodeSqliteConnection';

export interface TestDatabase {
  db: AppDatabase;
  raw: NodeSqliteConnection;
}

/** A fresh, fully migrated database, configured exactly like the app's connection. */
export async function createTestDatabase(path?: string): Promise<TestDatabase> {
  const raw = openNodeSqliteConnection(path);
  raw.exec(CONNECTION_PRAGMAS);
  const db: AppDatabase = drizzle(raw.connection, { schema });
  await migrate(db, migrations);
  return { db, raw };
}
