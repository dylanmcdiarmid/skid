import type { Database } from "bun:sqlite";
import type { DatabaseConnection } from "kysely";
/**
 * Config for the SQLite dialect.
 */
export interface BunSqliteDialectConfig {
  /**
   * An sqlite Database instance or a function that returns one.
   */
  database: Database;

  /**
   * Called once when the first query is executed.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}
