import type { Kysely } from 'kysely';
import type { DB } from '../types/db';

export class SessionTemplatesDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(template: {
    unique_name: string;
    display: string;
    default_recommended_time_minutes?: number;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('practice_session_templates')
      .values({
        id,
        unique_name: template.unique_name,
        display: template.display,
        default_recommended_time_minutes:
          template.default_recommended_time_minutes ?? 30,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async get(id: string) {
    return this.db
      .selectFrom('practice_session_templates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async list(includeDisabled = false) {
    let query = this.db.selectFrom('practice_session_templates').selectAll();

    if (!includeDisabled) {
      query = query.where('disabled_at', 'is', null);
    }

    return query.execute();
  }

  async update(
    id: string,
    updates: {
      display?: string;
      default_recommended_time_minutes?: number;
      unique_name?: string;
      disabled_at?: number | null;
    }
  ) {
    return this.db
      .updateTable('practice_session_templates')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string) {
    return this.db
      .deleteFrom('practice_session_templates')
      .where('id', '=', id)
      .executeTakeFirst();
  }

  // --- Line Items ---

  async addLineItem(item: {
    practice_session_template_id: string;
    display: string;
    title?: string;
    sort_order?: number;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('practice_session_line_items')
      .values({
        id,
        practice_session_template_id: item.practice_session_template_id,
        display: item.display,
        title: item.title ?? null,
        sort_order: item.sort_order ?? 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateLineItem(
    id: string,
    updates: {
      display?: string;
      title?: string | null;
      sort_order?: number;
    }
  ) {
    return this.db
      .updateTable('practice_session_line_items')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async getLineItems(practice_session_template_id: string) {
    return this.db
      .selectFrom('practice_session_line_items')
      .selectAll()
      .where('practice_session_template_id', '=', practice_session_template_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async removeLineItem(id: string) {
    return this.db
      .deleteFrom('practice_session_line_items')
      .where('id', '=', id)
      .executeTakeFirst();
  }

  // --- Required Generators ---

  async addRequiredGenerator(req: {
    practice_session_template_id: string;
    generator_id: string;
    quantity?: number;
    label?: string;
  }) {
    const id = crypto.randomUUID();
    return this.db
      .insertInto('practice_session_template_required_generators')
      .values({
        id,
        practice_session_template_id: req.practice_session_template_id,
        generator_id: req.generator_id,
        quantity: req.quantity ?? 1,
        label: req.label,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async getRequiredGenerators(practice_session_template_id: string) {
    return this.db
      .selectFrom('practice_session_template_required_generators')
      .selectAll()
      .where('practice_session_template_id', '=', practice_session_template_id)
      .execute();
  }

  async removeRequiredGenerator(id: string) {
    return this.db
      .deleteFrom('practice_session_template_required_generators')
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
