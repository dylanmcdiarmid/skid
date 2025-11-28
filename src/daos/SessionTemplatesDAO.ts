import type { Kysely, Selectable } from 'kysely';
import type {
  DB,
  PracticeSessionLineItems,
  PracticeSessionTemplateRequiredGenerators,
  PracticeSessionTemplates,
} from '../types/db';

export type PracticeSessionTemplate = Selectable<PracticeSessionTemplates>;
export type PracticeSessionLineItem = Selectable<PracticeSessionLineItems>;
export type PracticeSessionTemplateRequiredGenerator =
  Selectable<PracticeSessionTemplateRequiredGenerators>;

export class SessionTemplatesDAO {
  constructor(private readonly db: Kysely<DB>) {}

  async create(template: {
    unique_name: string;
    display: string;
    default_recommended_time_minutes?: number;
  }): Promise<PracticeSessionTemplate> {
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

  async get(id: string): Promise<
    | (PracticeSessionTemplate & {
        line_items: PracticeSessionLineItem[];
      })
    | undefined
  > {
    const template = await this.db
      .selectFrom('practice_session_templates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!template) {
      return;
    }

    const lineItems = await this.getLineItems(id);

    return {
      ...template,
      line_items: lineItems,
    };
  }

  async list(params?: {
    search?: string;
    sortId?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
    showDisabled?: boolean;
  }): Promise<{ items: PracticeSessionTemplate[]; totalItems: number }> {
    let query = this.db.selectFrom('practice_session_templates').selectAll();

    if (!params?.showDisabled) {
      query = query.where('disabled_at', 'is', null);
    }

    if (params?.search) {
      const search = `%${params.search.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb('display', 'like', search),
          eb('unique_name', 'like', search),
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

    // Count query
    let countQuery = this.db
      .selectFrom('practice_session_templates')
      .select((eb) => eb.fn.count('id').as('count'));

    if (!params?.showDisabled) {
      countQuery = countQuery.where('disabled_at', 'is', null);
    }
    if (params?.search) {
      const search = `%${params.search.toLowerCase()}%`;
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('display', 'like', search),
          eb('unique_name', 'like', search),
        ])
      );
    }

    const countResult = await countQuery.executeTakeFirst();
    const totalItems = Number(countResult?.count ?? 0);

    return { items, totalItems };
  }

  async update(
    id: string,
    updates: {
      display?: string;
      default_recommended_time_minutes?: number;
      unique_name?: string;
      disabled_at?: number | null;
    }
  ): Promise<PracticeSessionTemplate | undefined> {
    return this.db
      .updateTable('practice_session_templates')
      .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async delete(id: string): Promise<{ numDeletedRows: bigint } | undefined> {
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
  }): Promise<PracticeSessionLineItem> {
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
  ): Promise<PracticeSessionLineItem | undefined> {
    return this.db
      .updateTable('practice_session_line_items')
      .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async getLineItems(
    practice_session_template_id: string
  ): Promise<PracticeSessionLineItem[]> {
    return this.db
      .selectFrom('practice_session_line_items')
      .selectAll()
      .where('practice_session_template_id', '=', practice_session_template_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async getLineItemsForSessions(
    practice_session_template_ids: string[]
  ): Promise<PracticeSessionLineItem[]> {
    if (practice_session_template_ids.length === 0) {
      return [];
    }
    return this.db
      .selectFrom('practice_session_line_items')
      .selectAll()
      .where(
        'practice_session_template_id',
        'in',
        practice_session_template_ids
      )
      .orderBy('sort_order', 'asc')
      .execute();
  }

  async removeLineItem(
    id: string
  ): Promise<{ numDeletedRows: bigint } | undefined> {
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
  }): Promise<PracticeSessionTemplateRequiredGenerator> {
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

  async getRequiredGenerators(
    practice_session_template_id: string
  ): Promise<PracticeSessionTemplateRequiredGenerator[]> {
    return this.db
      .selectFrom('practice_session_template_required_generators')
      .selectAll()
      .where('practice_session_template_id', '=', practice_session_template_id)
      .execute();
  }

  async removeRequiredGenerator(
    id: string
  ): Promise<{ numDeletedRows: bigint } | undefined> {
    return this.db
      .deleteFrom('practice_session_template_required_generators')
      .where('id', '=', id)
      .executeTakeFirst();
  }
}
