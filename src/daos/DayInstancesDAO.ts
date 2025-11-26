import type { Kysely } from 'kysely';
import type { DB } from '../types/db';

export class DayInstancesDAO {
  constructor(private readonly db: Kysely<DB>) {}

  // --- Day Instances ---

  async createDay(data: {
    id: string; // YYYY-MM-DD
    source_day_template_id?: string;
    notes?: string;
  }) {
    return this.db
      .insertInto('day_instances')
      .values({
        id: data.id,
        source_day_template_id: data.source_day_template_id ?? null,
        notes: data.notes ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getDay(id: string) {
    return this.db
      .selectFrom('day_instances')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async updateDay(
    id: string,
    updates: {
      notes?: string | null;
    }
  ) {
    return this.db
      .updateTable('day_instances')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  // --- Session Instances ---

  async createSession(data: {
    day_instance_id: string;
    practice_session_template_id?: string;
    display: string;
    sort_order?: number;
    recommended_time_minutes?: number;
    notes?: string;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('practice_session_instances')
      .values({
        id,
        day_instance_id: data.day_instance_id,
        practice_session_template_id: data.practice_session_template_id ?? null,
        display: data.display,
        sort_order: data.sort_order ?? 0,
        recommended_time_minutes: data.recommended_time_minutes ?? null,
        notes: data.notes ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getSessionsForDay(day_instance_id: string) {
    return this.db
      .selectFrom('practice_session_instances')
      .selectAll()
      .where('day_instance_id', '=', day_instance_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async updateSession(
    id: string,
    updates: {
      display?: string;
      sort_order?: number;
      actual_time_spent_minutes?: number | null;
      notes?: string | null;
      completed_at?: number | null;
      canceled_at?: number | null;
    }
  ) {
    return this.db
      .updateTable('practice_session_instances')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  // --- Line Item Instances ---

  async createLineItem(data: {
    practice_session_instance_id: string;
    source_line_item_id?: string;
    display: string;
    title?: string;
    sort_order?: number;
    notes?: string;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('practice_session_instance_line_items')
      .values({
        id,
        practice_session_instance_id: data.practice_session_instance_id,
        source_line_item_id: data.source_line_item_id ?? null,
        display: data.display,
        title: data.title ?? null,
        sort_order: data.sort_order ?? 0,
        notes: data.notes ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getLineItemsForSession(practice_session_instance_id: string) {
    return this.db
      .selectFrom('practice_session_instance_line_items')
      .selectAll()
      .where('practice_session_instance_id', '=', practice_session_instance_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async updateLineItem(
    id: string,
    updates: {
      display?: string;
      title?: string | null;
      sort_order?: number;
      is_completed?: number; // 0 or 1
      completed_at?: number | null;
      notes?: string | null;
    }
  ) {
    return this.db
      .updateTable('practice_session_instance_line_items')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  // --- Generated Values ---

  async createGeneratedValue(data: {
    practice_session_instance_id: string;
    generator_id?: string;
    display_value: string;
    sort_order?: number;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('practice_session_instance_generated_values')
      .values({
        id,
        practice_session_instance_id: data.practice_session_instance_id,
        generator_id: data.generator_id ?? null,
        display_value: data.display_value,
        sort_order: data.sort_order ?? 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getGeneratedValuesForSession(practice_session_instance_id: string) {
    return this.db
      .selectFrom('practice_session_instance_generated_values')
      .selectAll()
      .where('practice_session_instance_id', '=', practice_session_instance_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }
}
