import type { Kysely } from 'kysely';
import type { DB } from '../types/db';

export class GeneratorsDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(data: { name: string; strategy: string; data_source?: string }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('generators')
      .values({
        id,
        name: data.name,
        strategy: data.strategy,
        data_source: data.data_source,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async list() {
    return this.db.selectFrom('generators').selectAll().execute();
  }

  async get(id: string) {
    return this.db
      .selectFrom('generators')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async delete(id: string) {
    return this.db
      .deleteFrom('generators')
      .where('id', '=', id)
      .executeTakeFirst();
  }

  // --- History ---

  async logHistory(data: {
    generator_id: string;
    value_generated: string;
    day_instance_id?: string;
    picked_at?: number;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('generator_history')
      .values({
        id,
        generator_id: data.generator_id,
        value_generated: data.value_generated,
        day_instance_id: data.day_instance_id,
        picked_at: data.picked_at, // will use default if undefined, but kysely might insert null if we are not careful.
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getHistory(generator_id: string, limit = 10) {
    return this.db
      .selectFrom('generator_history')
      .selectAll()
      .where('generator_id', '=', generator_id)
      .orderBy('picked_at', 'desc') // Most recent first
      .limit(limit)
      .execute();
  }
}
