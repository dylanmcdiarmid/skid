import type { Kysely } from 'kysely';
import type { DB } from '../types/db';

export class DayTemplatesDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(template: { display: string }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('day_templates')
      .values({
        id,
        display: template.display,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async get(id: string) {
    return this.db
      .selectFrom('day_templates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async list(includeDisabled = false) {
    let query = this.db.selectFrom('day_templates').selectAll();

    if (!includeDisabled) {
      query = query.where('disabled_at', 'is', null);
    }

    return query.execute();
  }

  async update(
    id: string,
    updates: {
      display?: string;
      disabled_at?: number | null;
    }
  ) {
    return this.db
      .updateTable('day_templates')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string) {
    return this.db
      .deleteFrom('day_templates')
      .where('id', '=', id)
      .executeTakeFirst();
  }

  // --- Day Template Items ---

  async addSessionToDay(item: {
    day_template_id: string;
    practice_session_template_id: string;
    recommended_time_minutes?: number;
    sort_order?: number;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('day_template_items')
      .values({
        id,
        day_template_id: item.day_template_id,
        practice_session_template_id: item.practice_session_template_id,
        recommended_time_minutes: item.recommended_time_minutes,
        sort_order: item.sort_order ?? 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getSessionsForDay(day_template_id: string) {
    // Returns items joined with session details potentially, or just items.
    // For now, just the items with sort order.
    return this.db
      .selectFrom('day_template_items')
      .selectAll()
      .where('day_template_id', '=', day_template_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async removeSessionFromDay(id: string) {
    return this.db
      .deleteFrom('day_template_items')
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
