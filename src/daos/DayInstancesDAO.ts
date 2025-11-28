import type { Kysely, Selectable } from 'kysely';
import type {
  DayInstances,
  DB,
  PracticeSessionInstanceGeneratedValues,
  PracticeSessionInstanceLineItems,
  PracticeSessionInstances,
} from '../types/db';

export type DayInstance = Selectable<DayInstances>;
export type PracticeSessionInstance = Selectable<PracticeSessionInstances>;
export type PracticeSessionInstanceLineItem =
  Selectable<PracticeSessionInstanceLineItems>;
export type PracticeSessionInstanceGeneratedValue =
  Selectable<PracticeSessionInstanceGeneratedValues>;

export class DayInstancesDAO {
  constructor(private readonly db: Kysely<DB>) {}

  // --- Day Instances ---

  async createDay(data: {
    id: string; // YYYY-MM-DD
    source_day_template_id?: string;
    notes?: string;
  }): Promise<DayInstance> {
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

  async getDay(id: string): Promise<DayInstance | undefined> {
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
  ): Promise<DayInstance | undefined> {
    return this.db
      .updateTable('day_instances')
      .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async createFromTemplate(
    date: string,
    templateId: string
  ): Promise<DayInstance> {
    return this.db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('day_instances')
        .selectAll()
        .where('id', '=', date)
        .executeTakeFirst();
      if (existing) {
        throw new Error('Day instance already exists');
      }

      await trx
        .selectFrom('day_templates')
        .selectAll()
        .where('id', '=', templateId)
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('day_instances')
        .values({
          id: date,
          source_day_template_id: templateId,
          created_at: Math.floor(Date.now() / 1000),
        })
        .execute();

      const items = await trx
        .selectFrom('day_template_items')
        .selectAll()
        .where('day_template_id', '=', templateId)
        .orderBy('sort_order', 'asc')
        .execute();

      for (const item of items) {
        const sessionTemplate = await trx
          .selectFrom('practice_session_templates')
          .selectAll()
          .where('id', '=', item.practice_session_template_id)
          .executeTakeFirst();

        if (!sessionTemplate) {
          continue;
        }

        const sessionInstanceId = crypto.randomUUID();
        await trx
          .insertInto('practice_session_instances')
          .values({
            id: sessionInstanceId,
            day_instance_id: date,
            practice_session_template_id: sessionTemplate.id,
            display: sessionTemplate.display,
            sort_order: item.sort_order,
            recommended_time_minutes:
              item.recommended_time_minutes ??
              sessionTemplate.default_recommended_time_minutes,
            created_at: Math.floor(Date.now() / 1000),
          })
          .execute();

        const lineItems = await trx
          .selectFrom('practice_session_line_items')
          .selectAll()
          .where('practice_session_template_id', '=', sessionTemplate.id)
          .orderBy('sort_order', 'asc')
          .execute();

        for (const li of lineItems) {
          await trx
            .insertInto('practice_session_instance_line_items')
            .values({
              id: crypto.randomUUID(),
              practice_session_instance_id: sessionInstanceId,
              source_line_item_id: li.id,
              display: li.display,
              title: li.title,
              sort_order: li.sort_order,
              is_completed: 0,
            })
            .execute();
        }
      }

      return trx
        .selectFrom('day_instances')
        .selectAll()
        .where('id', '=', date)
        .executeTakeFirstOrThrow();
    });
  }

  async delete(id: string): Promise<{ numDeletedRows: bigint } | undefined> {
    return this.db
      .deleteFrom('day_instances')
      .where('id', '=', id)
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
  }): Promise<PracticeSessionInstance> {
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

  async getSessionsForDay(
    day_instance_id: string
  ): Promise<PracticeSessionInstance[]> {
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
      recommended_time_minutes?: number | null;
    }
  ): Promise<PracticeSessionInstance | undefined> {
    return this.db.transaction().execute(async (trx) => {
      const session = await trx
        .selectFrom('practice_session_instances')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!session) {
        return;
      }

      const updated = await trx
        .updateTable('practice_session_instances')
        .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      // Sync Logic
      if (updates.display && session.practice_session_template_id) {
        await trx
          .updateTable('practice_session_templates')
          .set({
            display: updates.display,
            updated_at: Math.floor(Date.now() / 1000),
          })
          .where('id', '=', session.practice_session_template_id)
          .execute();
      }

      if (
        updates.recommended_time_minutes !== undefined &&
        session.practice_session_template_id
      ) {
        const dayInstance = await trx
          .selectFrom('day_instances')
          .selectAll()
          .where('id', '=', session.day_instance_id)
          .executeTakeFirst();

        if (dayInstance?.source_day_template_id) {
          await trx
            .updateTable('day_template_items')
            .set({
              recommended_time_minutes: updates.recommended_time_minutes ?? 0,
            })
            .where('day_template_id', '=', dayInstance.source_day_template_id)
            .where(
              'practice_session_template_id',
              '=',
              session.practice_session_template_id
            )
            .execute();
        }
      }

      return updated;
    });
  }

  async deleteSession(
    id: string
  ): Promise<{ numDeletedRows: bigint } | undefined> {
    return this.db
      .deleteFrom('practice_session_instances')
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async reorderSessions(
    day_instance_id: string,
    sessionIds: string[]
  ): Promise<void> {
    return this.db.transaction().execute(async (trx) => {
      for (let i = 0; i < sessionIds.length; i++) {
        await trx
          .updateTable('practice_session_instances')
          .set({ sort_order: i, updated_at: Math.floor(Date.now() / 1000) })
          .where('id', '=', sessionIds[i])
          .where('day_instance_id', '=', day_instance_id)
          .execute();
      }
    });
  }

  // --- Line Item Instances ---

  async createLineItem(data: {
    practice_session_instance_id: string;
    source_line_item_id?: string;
    display: string;
    title?: string;
    sort_order?: number;
    notes?: string;
  }): Promise<PracticeSessionInstanceLineItem> {
    return this.db.transaction().execute(async (trx) => {
      const id = crypto.randomUUID();
      const newItem = await trx
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

      // Sync Logic: Add to template if possible
      const session = await trx
        .selectFrom('practice_session_instances')
        .select(['practice_session_template_id'])
        .where('id', '=', data.practice_session_instance_id)
        .executeTakeFirst();

      if (
        session?.practice_session_template_id &&
        (data.source_line_item_id || !data.source_line_item_id) // If source ID is missing, we might want to create one? Mock does it.
      ) {
        // The Mock logic: if there is a sourceId, it appends. But data.source_line_item_id comes from client?
        // If client creates a NEW line item, it sends data without source_line_item_id (or generated one?).
        // The mock: `const sourceId = session.practice_session_template_id ? faker.string.uuid() : null;`
        // So if connected to template, we CREATE a new source line item.
        const sourceId = data.source_line_item_id || crypto.randomUUID();

        // If we generated a source ID, we should probably update the instance to point to it?
        // But we just inserted the instance.

        await trx
          .insertInto('practice_session_line_items')
          .values({
            id: sourceId,
            practice_session_template_id: session.practice_session_template_id,
            display: data.display,
            title: data.title ?? null,
            sort_order: data.sort_order ?? 0,
          })
          .execute();

        if (!data.source_line_item_id) {
          // Update the instance to link to the new source item
          await trx
            .updateTable('practice_session_instance_line_items')
            .set({ source_line_item_id: sourceId })
            .where('id', '=', id)
            .execute();
          newItem.source_line_item_id = sourceId; // Update return value
        }
      }

      return newItem;
    });
  }

  async getLineItemsForSession(
    practice_session_instance_id: string
  ): Promise<PracticeSessionInstanceLineItem[]> {
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
  ): Promise<PracticeSessionInstanceLineItem | undefined> {
    return this.db.transaction().execute(async (trx) => {
      const item = await trx
        .selectFrom('practice_session_instance_line_items')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!item) {
        return;
      }

      const updated = await trx
        .updateTable('practice_session_instance_line_items')
        .set({ ...updates, updated_at: Math.floor(Date.now() / 1000) })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      // Sync Logic
      if (
        (updates.display !== undefined || updates.title !== undefined) &&
        item.source_line_item_id
      ) {
        await trx
          .updateTable('practice_session_line_items')
          .set({
            updated_at: Math.floor(Date.now() / 1000),
          })
          .where('id', '=', item.source_line_item_id)
          // We need to construct the set object carefully
          .$call((qb) => {
            const setObj: any = { updated_at: Math.floor(Date.now() / 1000) };
            if (updates.display !== undefined) {
              setObj.display = updates.display;
            }
            if (updates.title !== undefined) {
              setObj.title = updates.title;
            }
            return qb.set(setObj);
          })
          .execute();
      }

      return updated;
    });
  }

  async deleteLineItem(id: string): Promise<void> {
    return this.db.transaction().execute(async (trx) => {
      const item = await trx
        .selectFrom('practice_session_instance_line_items')
        .select(['source_line_item_id'])
        .where('id', '=', id)
        .executeTakeFirst();

      await trx
        .deleteFrom('practice_session_instance_line_items')
        .where('id', '=', id)
        .execute();

      // Sync Logic: Remove from template
      if (item?.source_line_item_id) {
        await trx
          .deleteFrom('practice_session_line_items')
          .where('id', '=', item.source_line_item_id)
          .execute();
      }
    });
  }

  async reorderLineItems(sessionId: string, itemIds: string[]): Promise<void> {
    return this.db.transaction().execute(async (trx) => {
      // Update sort order for instances
      for (let i = 0; i < itemIds.length; i++) {
        await trx
          .updateTable('practice_session_instance_line_items')
          .set({ sort_order: i, updated_at: Math.floor(Date.now() / 1000) })
          .where('id', '=', itemIds[i])
          .where('practice_session_instance_id', '=', sessionId)
          .execute();
      }

      // Sync Logic: Update template sort order
      // We need to map instance IDs to source IDs
      const items = await trx
        .selectFrom('practice_session_instance_line_items')
        .select(['id', 'source_line_item_id'])
        .where('practice_session_instance_id', '=', sessionId)
        .execute();

      const itemMap = new Map(items.map((i) => [i.id, i.source_line_item_id]));

      // Update source items
      for (let i = 0; i < itemIds.length; i++) {
        const sourceId = itemMap.get(itemIds[i]);
        if (sourceId) {
          await trx
            .updateTable('practice_session_line_items')
            .set({ sort_order: i, updated_at: Math.floor(Date.now() / 1000) })
            .where('id', '=', sourceId)
            .execute();
        }
      }
    });
  }

  // --- Generated Values ---

  async createGeneratedValue(data: {
    practice_session_instance_id: string;
    generator_id?: string;
    display_value: string;
    sort_order?: number;
  }): Promise<PracticeSessionInstanceGeneratedValue> {
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

  async getGeneratedValuesForSession(
    practice_session_instance_id: string
  ): Promise<PracticeSessionInstanceGeneratedValue[]> {
    return this.db
      .selectFrom('practice_session_instance_generated_values')
      .selectAll()
      .where('practice_session_instance_id', '=', practice_session_instance_id)
      .orderBy('sort_order', 'asc')
      .execute();
  }
}
