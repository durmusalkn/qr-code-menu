import { drizzle } from 'drizzle-orm/expo-sqlite/driver';
import { openDatabaseSync } from 'expo-sqlite';

import { CONNECTION_PRAGMAS } from './pragmas';
import * as schema from './schema';
import type { AppDatabase } from './types';

export const DATABASE_NAME = 'anilar.db';

// enableChangeListener powers drizzle's useLiveQuery.
const connection = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
connection.execSync(CONNECTION_PRAGMAS);

export const db: AppDatabase = drizzle(connection, { schema });
