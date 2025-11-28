import type { Kysely, Selectable } from 'kysely';
import type { DB, DayTemplateItems, DayTemplates } from '../types/db';

export type DayTemplate = Selectable<DayTemplates>;
export type DayTemplateItem = Selectable<DayTemplateItems>;

export class DayTemplatesDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(template: { display: string }): Promise<DayTemplate> {
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

  async get(id: string): Promise<DayTemplate | undefined> {
    return this.db
      .selectFrom('day_templates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async list(params?: {
    search?: string;
    sortId?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
    showDisabled?: boolean;
  }): Promise<{ items: DayTemplate[]; totalItems: number }> {
    let query = this.db.selectFrom('day_templates').selectAll();

    if (!params?.showDisabled) {
      query = query.where('disabled_at', 'is', null);
    }

    if (params?.search) {
      const search = `%${params.search.toLowerCase()}%`;
      query = query.where('display', 'like', search);
    }

    if (params?.sortId && params?.sortDir) {
      query = query.orderBy(params.sortId as any, params.sortDir);
    }

    if (params?.page && params?.pageSize) {
      const offset = (params.page - 1) * params.pageSize;
      query = query.limit(params.pageSize).offset(offset);
    }

    const items = await query.execute();

    // Count
    let countQuery = this.db
      .selectFrom('day_templates')
      .select((eb) => eb.fn.count('id').as('count'));

    if (!params?.showDisabled) {
      countQuery = countQuery.where('disabled_at', 'is', null);
    }
    if (params?.search) {
      const search = `%${params.search.toLowerCase()}%`;
      countQuery = countQuery.where('display', 'like', search);
    }

    const countResult = await countQuery.executeTakeFirst();
    const totalItems = Number(countResult?.count ?? 0);

    return { items, totalItems };
  }

  async update(
    id: string,
    updates: {
      display?: string;
      disabled_at?: number | null;
    }
  ): Promise<DayTemplate | undefined> {
    return this.db
      .updateTable('day_templates')
      .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string): Promise<{ numDeletedRows: bigint } | undefined> {
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
  }): Promise<DayTemplateItem> {
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

  async getSessionsForDay(
    day_template_id: string
  ): Promise<
    (DayTemplateItem & { practice_session_display: string })[]
  > {
    // Join with practice_session_templates to get display name
    return this.db
      .selectFrom('day_template_items')
      .innerJoin(
        'practice_session_templates',
        'practice_session_templates.id',
        'day_template_items.practice_session_template_id'
      )
      .select([
        'day_template_items.id',
        'day_template_items.day_template_id',
        'day_template_items.practice_session_template_id',
        'day_template_items.recommended_time_minutes',
        'day_template_items.sort_order',
        'practice_session_templates.display as practice_session_display',
      ])
      .where('day_template_id', '=', day_template_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async removeSessionFromDay(
    id: string
  ): Promise<{ numDeletedRows: bigint } | undefined> {
    return this.db
      .deleteFrom('day_template_items')
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
