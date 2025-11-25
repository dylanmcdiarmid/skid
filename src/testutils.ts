import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Kysely } from "kysely";
import { BunSqliteDialect } from "./bun-sqlite-dialect/dialect";
import type { DB } from "./types/db"; // Your generated types

// Read the schema once at startup (FAST)
const schemaPath = join(import.meta.dir, "../db/schema.sql");
const schemaSql = readFileSync(schemaPath, "utf-8");

export function createTestDb() {
  // 1. Create a fresh in-memory SQLite instance
  // ":memory:" means it exists only in RAM
  const sqlite = new Database(":memory:");

  // 2. Apply your schema immediately
  // We use .exec() for speed; no need for Kysely here yet
  sqlite.run(schemaSql);

  // 3. Create the Kysely instance wrapping this raw connection
  const db = new Kysely<DB>({
    dialect: new BunSqliteDialect({
      database: sqlite,
    }),
  });

  return db;
}
