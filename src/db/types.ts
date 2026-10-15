import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite/driver';

import type * as schema from './schema';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;
