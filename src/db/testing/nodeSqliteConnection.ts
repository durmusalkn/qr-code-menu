/**
 * Test-only adapter that exposes Node's built-in `node:sqlite` through the subset of the
 * expo-sqlite API used by drizzle's expo driver (`prepareSync` → `executeSync` /
 * `executeForRawResultSync`). Tests therefore exercise the real driver, dialect and migrator
 * against a real SQLite engine, without native modules.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

type SqlValue = string | number | bigint | null | Uint8Array;

interface NodeStatement {
  columns(): unknown[];
  setReturnArrays(enabled: boolean): void;
  run(...params: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  all(...params: SqlValue[]): unknown[];
}

interface NodeDatabase {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
}

interface NodeSqliteModule {
  DatabaseSync: new (path: string) => NodeDatabase;
}

function loadNodeSqlite(): NodeSqliteModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('node:sqlite') as NodeSqliteModule;
}

function toSqlValue(value: unknown): SqlValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    value instanceof Uint8Array
  ) {
    return value;
  }
  throw new TypeError(`Unsupported SQL parameter: ${String(value)}`);
}

function execute(statement: NodeStatement, params: unknown[] = [], raw: boolean) {
  const values = params.map(toSqlValue);
  if (statement.columns().length === 0) {
    const result = statement.run(...values);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
      getAllSync: () => [],
      getFirstSync: () => null,
    };
  }
  statement.setReturnArrays(raw);
  const rows = statement.all(...values);
  return {
    changes: 0,
    lastInsertRowId: 0,
    getAllSync: () => rows,
    getFirstSync: () => rows[0] ?? null,
  };
}

export interface NodeSqliteConnection {
  /** Drop-in for the expo-sqlite connection object, as far as drizzle is concerned. */
  connection: SQLiteDatabase;
  exec(sql: string): void;
  all(sql: string): unknown[];
  close(): void;
}

export function openNodeSqliteConnection(path = ':memory:'): NodeSqliteConnection {
  const { DatabaseSync } = loadNodeSqlite();
  const database = new DatabaseSync(path);

  const connection = {
    prepareSync(sql: string) {
      const statement = database.prepare(sql);
      return {
        executeSync: (params?: unknown[]) => execute(statement, params, false),
        executeForRawResultSync: (params?: unknown[]) => execute(statement, params, true),
      };
    },
    execSync(sql: string) {
      database.exec(sql);
    },
  };

  return {
    connection: connection as unknown as SQLiteDatabase,
    exec: (sql) => database.exec(sql),
    all: (sql) => database.prepare(sql).all(),
    close: () => database.close(),
  };
}

/** A database file path in a fresh temporary directory (WAL needs a file, not `:memory:`). */
export function makeTempDatabasePath(): string {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const fs = require('node:fs') as { mkdtempSync(prefix: string): string };
  const os = require('node:os') as { tmpdir(): string };
  const path = require('node:path') as { join(...parts: string[]): string };
  /* eslint-enable @typescript-eslint/no-require-imports */
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'anilar-test-')), 'test.db');
}
