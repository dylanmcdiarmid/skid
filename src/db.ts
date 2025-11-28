import { Database } from 'bun:sqlite';
import { Kysely } from 'kysely';
import { BunSqliteDialect } from './bun-sqlite-dialect/dialect';
import type { DB } from './types/db';

const dbPath = process.env.DB_PATH || 'db/skid.sqlite';

const sqlite = new Database(dbPath);
// Optimize for WAL mode for better concurrency if needed
// sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = new Kysely<DB>({
  dialect: new BunSqliteDialect({
    database: sqlite,
  }),
});

