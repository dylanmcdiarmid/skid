import type { Kysely, Selectable } from 'kysely';
import type { DB, PlanningItems } from '../types/db';

export type PlanningItem = Selectable<PlanningItems>;

export class PlanningDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(data: {
    display: string;
    notes?: string;
    min_day_instance_id?: string;
  }): Promise<PlanningItem> {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('planning_items')
      .values({
        id,
        display: data.display,
        notes: data.notes,
        min_day_instance_id: data.min_day_instance_id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listActive(asOfDate: string): Promise<PlanningItem[]> {
    return this.db
      .selectFrom('planning_items')
      .selectAll()
      .where('completed_at', 'is', null)
      .where('was_rejected', '=', 0)
      .where((eb) =>
        eb.or([
          eb('min_day_instance_id', 'is', null),
          eb('min_day_instance_id', '<=', asOfDate),
        ])
      )
      .orderBy('created_at', 'desc')
      .execute();
  }

  async get(id: string): Promise<PlanningItem | undefined> {
    return this.db
      .selectFrom('planning_items')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async update(
    id: string,
    updates: {
      display?: string;
      notes?: string;
      min_day_instance_id?: string | null;
      was_rejected?: number;
      completed_at?: number | null;
    }
  ): Promise<PlanningItem | undefined> {
    return this.db
      .updateTable('planning_items')
      .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async snooze(
    id: string,
    untilDate: string
  ): Promise<PlanningItem | undefined> {
    return this.update(id, { min_day_instance_id: untilDate });
  }

  async reject(id: string): Promise<PlanningItem | undefined> {
    return this.update(id, { was_rejected: 1 });
  }

  async complete(id: string): Promise<PlanningItem | undefined> {
    return this.update(id, { completed_at: Math.floor(Date.now() / 1000) });
  }

  async delete(id: string): Promise<{ numDeletedRows: bigint } | undefined> {
    return this.db
      .deleteFrom('planning_items')
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
