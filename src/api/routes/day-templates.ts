import { Elysia, t } from 'elysia';
import { DayTemplatesDAO } from '../../daos/DayTemplatesDAO';
import { SessionTemplatesDAO } from '../../daos/SessionTemplatesDAO';
import { db } from '../../db';
import { Pagination, SortDirectionSchema } from '../../types/schemas';

const dao = new DayTemplatesDAO(db);
const sessionDao = new SessionTemplatesDAO(db);

const toISO = (ts: number | null | undefined) =>
  ts ? new Date(ts * 1000).toISOString() : null;

const PracticeSessionLineItemSchema = t.Object({
  id: t.String(),
  title: t.Union([t.String(), t.Null()]),
  display: t.String(),
  sort_order: t.Integer(),
  created_at: t.Union([t.String(), t.Null()]),
  updated_at: t.Union([t.String(), t.Null()]),
});

const DayTemplateItemSchema = t.Object({
  id: t.String(),
  practice_session_template_id: t.String(),
  practice_session_display: t.Optional(t.String()),
  recommended_time_minutes: t.Integer(),
  sort_order: t.Integer(),
  session_line_items: t.Array(PracticeSessionLineItemSchema),
});

const DayTemplateSchema = t.Object({
  id: t.String(),
  display: t.String(),
  items: t.Array(DayTemplateItemSchema),
  disabled_at: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
  updated_at: t.Union([t.String(), t.Null()]),
  last_touched: t.String(),
});

const CreateDayTemplateItemSchema = t.Object({
  practice_session_template_id: t.String(),
  recommended_time_minutes: t.Integer(),
  sort_order: t.Integer(),
});

const CreateDayTemplateSchema = t.Object({
  display: t.String(),
  items: t.Array(CreateDayTemplateItemSchema),
});

const UpdateDayTemplateSchema = t.Partial(CreateDayTemplateSchema);

const resolveTemplateDetails = async (template: any) => {
  const items = await dao.getSessionsForDay(template.id);

  // Get all unique session IDs
  const sessionIds = [
    ...new Set(items.map((i) => i.practice_session_template_id)),
  ];
  const allLineItems = await sessionDao.getLineItemsForSessions(sessionIds);

  const resolvedItems = items.map((item) => {
    const sessionLineItems = allLineItems
      .filter(
        (li) =>
          li.practice_session_template_id === item.practice_session_template_id
      )
      .map((li) => ({
        ...li,
        sort_order: li.sort_order || 0,
        created_at: toISO(li.created_at),
        updated_at: toISO(li.updated_at),
      }));

    return {
      ...item,
      sort_order: item.sort_order || 0,
      practice_session_display:
        item.practice_session_display || 'Unknown Session',
      session_line_items: sessionLineItems,
    };
  });

  const created_at = toISO(template.created_at) || new Date().toISOString();
  const updated_at = toISO(template.updated_at);

  return {
    ...template,
    items: resolvedItems,
    created_at,
    updated_at,
    disabled_at: toISO(template.disabled_at),
    last_touched: updated_at || created_at,
  };
};

export const dayTemplatesRoutes = new Elysia({ prefix: '/day-templates' })
  .use(
    new Elysia().model({
      dayTemplate: DayTemplateSchema,
    })
  )
  .get(
    '/',
    async ({ query }) => {
      const { page, pageSize, search, sortId, sortDir, showDisabled } = query;
      const { items, totalItems } = await dao.list({
        page: page || 1,
        pageSize: pageSize || 20,
        search,
        sortId,
        sortDir,
        showDisabled,
      });

      const resolvedItems = await Promise.all(
        items.map(resolveTemplateDetails)
      );

      return {
        items: resolvedItems,
        totalItems,
        pageSize: pageSize || 20,
        currentPage: page || 1,
        totalPages: Math.ceil(totalItems / (pageSize || 20)),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
        search: t.Optional(t.String()),
        sortId: t.Optional(t.String()),
        sortDir: t.Optional(SortDirectionSchema),
        showDisabled: t.Optional(t.Boolean()),
      }),
      response: Pagination(DayTemplateSchema),
    }
  )
  .get(
    '/:id',
    async ({ params: { id }, status }) => {
      const template = await dao.get(id);
      if (!template) {
        return status(404, 'Day template not found');
      }
      return resolveTemplateDetails(template);
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: DayTemplateSchema,
        404: t.String(),
      },
    }
  )
  .post(
    '/',
    async ({ body }) => {
      const { items, ...data } = body;

      return db.transaction().execute(async (trx) => {
        const trxDao = new DayTemplatesDAO(trx);
        const template = await trxDao.create(data);

        if (items && items.length > 0) {
          for (const item of items) {
            await trxDao.addSessionToDay({
              ...item,
              day_template_id: template.id,
            });
          }
        }

        // Need to fetch again to return full structure with defaults
        // However, we can optimize since we know what we just inserted.
        // But resolveTemplateDetails needs to fetch session displays.
        // Using existing dao (with main db) to read is fine as long as transaction is committed?
        // No, transaction not committed yet. Need to use trxDao to read, but resolveTemplateDetails uses global `dao`.
        // I'll refactor resolveTemplateDetails to take dao as arg or just use `trx`
        // For simplicity, I'll just manually construct the response or implement `get` on trxDao.
        // `DayTemplatesDAO` has `get` and `getSessionsForDay`. `SessionTemplatesDAO` needs to be instantiated with trx.

        const trxSessionDao = new SessionTemplatesDAO(trx);
        // I'll inline the resolution logic or adapt it.

        // For now, let's just use the helper but I need to pass the transaction-aware DAOs.
        // Since I can't easily pass DAOs to the helper defined outside, I'll duplicate logic or make it a class method.
        // I'll just fetch what I need.

        const createdItems = await trxDao.getSessionsForDay(template.id);
        // This joins session templates. Kysely transaction sees the practice_session_templates (which are outside transaction scope usually or existing).

        const sessionIds = [
          ...new Set(createdItems.map((i) => i.practice_session_template_id)),
        ];
        const allLineItems =
          await trxSessionDao.getLineItemsForSessions(sessionIds);

        const resolvedItems = createdItems.map((item) => {
          const sessionLineItems = allLineItems
            .filter(
              (li) =>
                li.practice_session_template_id ===
                item.practice_session_template_id
            )
            .map((li) => ({
              ...li,
              sort_order: li.sort_order || 0,
              created_at: toISO(li.created_at),
              updated_at: toISO(li.updated_at),
            }));

          return {
            ...item,
            sort_order: item.sort_order || 0,
            recommended_time_minutes: item.recommended_time_minutes || 0,
            practice_session_display:
              item.practice_session_display || 'Unknown Session',
            session_line_items: sessionLineItems,
          };
        });

        const created_at =
          toISO(template.created_at) || new Date().toISOString();
        const updated_at = toISO(template.updated_at);

        return {
          ...template,
          items: resolvedItems,
          created_at,
          updated_at,
          disabled_at: toISO(template.disabled_at),
          last_touched: updated_at || created_at,
        };
      });
    },
    {
      body: CreateDayTemplateSchema,
      response: DayTemplateSchema,
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, status }) => {
      const { items, ...data } = body;

      return db.transaction().execute(async (trx) => {
        const trxDao = new DayTemplatesDAO(trx);

        let template = await trxDao.update(id, data);
        if (!(template || items)) {
          return status(404, 'Day template not found');
        }

        if (!template) {
          template = await trxDao.get(id);
          if (!template) {
            return status(404, 'Day template not found');
          }
        }

        if (items) {
          // Sync items. Simple strategy: Delete all and re-add.
          // Since day_template_items are just links (with some override data), deleting and re-adding is fine.
          // They don't have much history attached to them in the template.
          // Wait, if they have IDs, client might expect them to persist?
          // The `DayTemplateItem` interface has `id`.
          // But `CreateDayTemplateItemSchema` doesn't require `id`.
          // If we destroy IDs, we might confuse the client if it relies on them for keys.
          // But the client usually refetches after update.
          // "Sync" strategy: Delete all existing items for this day template.

          const existingItems = await trxDao.getSessionsForDay(id);
          for (const item of existingItems) {
            await trxDao.removeSessionFromDay(item.id);
          }

          for (const item of items) {
            await trxDao.addSessionToDay({
              ...item,
              day_template_id: id,
            });
          }
        }

        // Resolve and return
        const trxSessionDao = new SessionTemplatesDAO(trx);
        const finalItems = await trxDao.getSessionsForDay(id);
        const sessionIds = [
          ...new Set(finalItems.map((i) => i.practice_session_template_id)),
        ];
        const allLineItems =
          await trxSessionDao.getLineItemsForSessions(sessionIds);

        const resolvedItems = finalItems.map((item) => {
          const sessionLineItems = allLineItems
            .filter(
              (li) =>
                li.practice_session_template_id ===
                item.practice_session_template_id
            )
            .map((li) => ({
              ...li,
              sort_order: li.sort_order || 0,
              created_at: toISO(li.created_at),
              updated_at: toISO(li.updated_at),
            }));

          return {
            ...item,
            sort_order: item.sort_order || 0,
            recommended_time_minutes: item.recommended_time_minutes || 0,
            practice_session_display:
              item.practice_session_display || 'Unknown Session',
            session_line_items: sessionLineItems,
          };
        });

        const created_at =
          toISO(template.created_at) || new Date().toISOString();
        const updated_at = toISO(template.updated_at);

        return {
          ...template,
          items: resolvedItems,
          created_at,
          updated_at,
          disabled_at: toISO(template.disabled_at),
          last_touched: updated_at || created_at,
        };
      });
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateDayTemplateSchema,
      response: {
        200: DayTemplateSchema,
        404: t.String(),
      },
    }
  )
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      await dao.delete(id);
      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      response: t.Object({ success: t.Boolean() }),
    }
  );
