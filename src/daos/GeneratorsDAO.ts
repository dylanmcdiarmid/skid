import type { Kysely, Selectable } from 'kysely';
import type { DB, GeneratorHistory, Generators } from '../types/db';

export type Generator = Selectable<Generators>;
export type GeneratorHistoryEntry = Selectable<GeneratorHistory>;

export class GeneratorsDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(data: {
    name: string;
    strategy: string;
    data_source?: string;
  }): Promise<Generator> {
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

  async update(
    id: string,
    data: { name?: string; strategy?: string; data_source?: string }
  ): Promise<Generator | undefined> {
    return this.db
      .updateTable('generators')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async list(params?: {
    search?: string;
    sortId?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Generator[]; totalItems: number }> {
    let query = this.db.selectFrom('generators').selectAll();

    if (params?.search) {
      const search = `%${params.search}%`;
      query = query.where((eb) =>
        eb.or([
          eb('name', 'like', search),
          eb('strategy', 'like', search),
          eb('data_source', 'like', search),
        ])
      );
    }

    if (params?.sortId && params?.sortDir) {
      query = query.orderBy(params.sortId as any, params.sortDir);
    }

    if (params?.page && params?.pageSize) {
      const offset = (params.page - 1) * params.pageSize;
      query = query.limit(params.pageSize).offset(offset);
    }

    const items = await query.execute();

    // Get total count (simplified for now, separate query)
    let countQuery = this.db
      .selectFrom('generators')
      .select((eb) => eb.fn.count('id').as('count'));

    if (params?.search) {
      const search = `%${params.search}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('name', 'like', search),
          eb('strategy', 'like', search),
          eb('data_source', 'like', search),
        ])
      );
    }

    const countResult = await countQuery.executeTakeFirst();
    const totalItems = Number(countResult?.count ?? 0);

    return {
      items,
      totalItems,
    };
  }

  async get(id: string): Promise<Generator | undefined> {
    return this.db
      .selectFrom('generators')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async delete(id: string): Promise<{ numDeletedRows: bigint } | undefined> {
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
  }): Promise<GeneratorHistoryEntry> {
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

  async getHistory(
    generator_id: string,
    limit = 10
  ): Promise<GeneratorHistoryEntry[]> {
    return this.db
      .selectFrom('generator_history')
      .selectAll()
      .where('generator_id', '=', generator_id)
      .orderBy('picked_at', 'desc') // Most recent first
      .limit(limit)
      .execute();
  }
}
