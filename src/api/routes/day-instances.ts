import { Elysia, t } from 'elysia';
import { DayInstancesDAO } from '../../daos/DayInstancesDAO';
import { db } from '../../db';
import { Pagination, SortDirectionSchema } from '../../types/schemas';

const dao = new DayInstancesDAO(db);

const toISO = (ts: number | null | undefined) =>
  ts ? new Date(ts * 1000).toISOString() : null;

const PracticeSessionInstanceLineItemSchema = t.Object({
  id: t.String(),
  practice_session_instance_id: t.String(),
  source_line_item_id: t.Union([t.String(), t.Null()]),
  title: t.Union([t.String(), t.Null()]),
  display: t.String(),
  sort_order: t.Integer(),
  is_completed: t.Boolean(),
  completed_at: t.Union([t.String(), t.Null()]),
  updated_at: t.Union([t.String(), t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
});

const PracticeSessionInstanceSchema = t.Object({
  id: t.String(),
  day_instance_id: t.String(),
  practice_session_template_id: t.Union([t.String(), t.Null()]),
  display: t.String(),
  sort_order: t.Integer(),
  recommended_time_minutes: t.Union([t.Integer(), t.Null()]),
  actual_time_spent_minutes: t.Integer(),
  notes: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
  updated_at: t.Union([t.String(), t.Null()]),
  completed_at: t.Union([t.String(), t.Null()]),
  canceled_at: t.Union([t.String(), t.Null()]),
  line_items: t.Array(PracticeSessionInstanceLineItemSchema),
});

const DayInstanceSchema = t.Object({
  id: t.String(),
  source_day_template_id: t.Union([t.String(), t.Null()]),
  notes: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
  updated_at: t.Union([t.String(), t.Null()]),
  sessions: t.Array(PracticeSessionInstanceSchema),
  actual_time_total: t.Integer(),
});

const CreateDaySchema = t.Object({
  id: t.String(),
  source_day_template_id: t.Optional(t.String()),
  notes: t.Optional(t.String()),
});

const UpdateDaySchema = t.Object({
  notes: t.Optional(t.String()), // Assuming only notes can be updated on Day
});

const CreateSessionSchema = t.Object({
  display: t.String(),
  practice_session_template_id: t.Optional(t.String()),
  recommended_time_minutes: t.Optional(t.Integer()),
  sort_order: t.Optional(t.Integer()),
  notes: t.Optional(t.String()),
});

const UpdateSessionSchema = t.Object({
  display: t.Optional(t.String()),
  sort_order: t.Optional(t.Integer()),
  actual_time_spent_minutes: t.Optional(t.Integer()),
  notes: t.Optional(t.String()),
  completed_at: t.Optional(t.String()), // Client sends ISO string
  canceled_at: t.Optional(t.String()),
  recommended_time_minutes: t.Optional(t.Integer()),
});

const CreateLineItemSchema = t.Object({
  display: t.String(),
  title: t.Optional(t.String()),
  source_line_item_id: t.Optional(t.String()),
  sort_order: t.Optional(t.Integer()),
  notes: t.Optional(t.String()),
});

const UpdateLineItemSchema = t.Object({
  display: t.Optional(t.String()),
  title: t.Optional(t.String()),
  sort_order: t.Optional(t.Integer()),
  is_completed: t.Optional(t.Boolean()),
  completed_at: t.Optional(t.String()),
  notes: t.Optional(t.String()),
});

const transformLineItem = (li: any) => ({
  ...li,
  created_at: toISO(li.created_at),
  updated_at: toISO(li.updated_at),
  completed_at: toISO(li.completed_at),
  is_completed: !!li.is_completed,
});

const transformSession = (s: any, lineItems: any[]) => ({
  ...s,
  created_at: toISO(s.created_at) || new Date().toISOString(),
  updated_at: toISO(s.updated_at),
  completed_at: toISO(s.completed_at),
  canceled_at: toISO(s.canceled_at),
  line_items: lineItems.map(transformLineItem),
  actual_time_spent_minutes: s.actual_time_spent_minutes || 0,
});

const resolveDayDetails = async (day: any) => {
  const sessions = await dao.getSessionsForDay(day.id);
  const resolvedSessions = await Promise.all(
    sessions.map(async (s) => {
      const lineItems = await dao.getLineItemsForSession(s.id);
      return transformSession(s, lineItems);
    })
  );

  const actual_time_total = sessions.reduce(
    (sum, s) => sum + (s.actual_time_spent_minutes || 0),
    0
  );

  return {
    ...day,
    created_at: toISO(day.created_at) || new Date().toISOString(),
    updated_at: toISO(day.updated_at),
    sessions: resolvedSessions,
    actual_time_total,
  };
};

export const dayInstancesRoutes = new Elysia({ prefix: '/day-instances' })
  .use(
    new Elysia().model({
      dayInstance: DayInstanceSchema,
      session: PracticeSessionInstanceSchema,
      lineItem: PracticeSessionInstanceLineItemSchema,
    })
  )
  .get(
    '/',
    async ({ query }) => {
      // List Logic - Simplified (DAO currently doesn't support pagination fully with calculated fields, but I'll implement basic support here)
      // The DAO has simple getDay. I need to add list or implement it via raw query or iterating.
      // `dao.list` is missing in `DayInstancesDAO`.
      // I'll use raw query for list.

      const { page = 1, pageSize = 20, search, sortId, sortDir } = query;

      // Fetch days (paginated)
      const offset = (page - 1) * pageSize;

      // Count
      const countRes = await db
        .selectFrom('day_instances')
        .select((eb) => eb.fn.count('id').as('count'))
        .executeTakeFirst();
      const totalItems = Number(countRes?.count ?? 0);

      // Items
      let q = db.selectFrom('day_instances').selectAll();
      if (search) {
        q = q.where((eb) =>
          eb.or([
            eb('id', 'like', `%${search}%`),
            eb('notes', 'like', `%${search}%`),
          ])
        );
      }

      // Sorting by `actual_time_total` requires joining or subquery, or fetch all and sort (bad for pagination).
      // For now, default sort by date.
      if (sortId === 'id' || !sortId) {
        q = q.orderBy('id', sortDir || 'desc');
      } else {
        // Fallback to ID sort for unhandled sorts
        q = q.orderBy('id', sortDir || 'desc');
      }

      const days = await q.limit(pageSize).offset(offset).execute();

      const resolvedItems = await Promise.all(days.map(resolveDayDetails));

      // Re-sort if needed (e.g. actual_time_total) on the page only
      if (sortId === 'actual_time_total') {
        resolvedItems.sort((a, b) => {
          const valA = a.actual_time_total;
          const valB = b.actual_time_total;
          return sortDir === 'asc' ? valA - valB : valB - valA;
        });
      }

      return {
        items: resolvedItems,
        totalItems,
        pageSize,
        currentPage: page,
        totalPages: Math.ceil(totalItems / pageSize),
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
        search: t.Optional(t.String()),
        sortId: t.Optional(t.String()),
        sortDir: t.Optional(SortDirectionSchema),
      }),
      response: Pagination(DayInstanceSchema),
    }
  )
  .get(
    '/:id',
    async ({ params: { id }, status }) => {
      const day = await dao.getDay(id);
      if (!day) {
        return status(404, 'Day not found');
      }
      return resolveDayDetails(day);
    },
    {
      params: t.Object({ id: t.String() }),
      // Update response to map status codes to schemas
      response: {
        200: DayInstanceSchema,
        404: t.String(),
      },
    }
  )
  .post(
    '/',
    async ({ body }) => {
      const { id, source_day_template_id, notes } = body;
      console.log(
        'id, source_day_template_id, notes',
        id,
        source_day_template_id,
        notes
      );
      if (source_day_template_id) {
        const day = await dao.createFromTemplate(id, source_day_template_id);
        return resolveDayDetails(day);
      }
      const day = await dao.createDay({ id, notes });
      return resolveDayDetails(day);
    },
    {
      body: CreateDaySchema,
      response: DayInstanceSchema,
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, status }) => {
      const day = await dao.updateDay(id, body);
      if (!day) {
        return status(404, 'Day not found');
      }
      return resolveDayDetails(day);
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdateDaySchema,
      response: {
        200: DayInstanceSchema,
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
  )
  // Sessions
  .post(
    '/:id/sessions',
    async ({ params: { id }, body }) => {
      // We need to re-fetch the day to return the full object because UI expects full day update?
      // No, UI usually expects the created object or updates local state.
      // Mock returned the session? No, Mock updated locally.
      // Client `createLineItem` returns LineItem. `updateSession` returns Session.
      // I'll return Session.

      const session = await dao.createSession({
        day_instance_id: id,
        ...body,
      });

      // Return transformed session (with empty line items)
      return transformSession(session, []);
    },
    {
      params: t.Object({ id: t.String() }),
      body: CreateSessionSchema,
      response: PracticeSessionInstanceSchema,
    }
  )
  .put(
    '/:id/sessions/:sessionId',
    async ({ params: { sessionId }, body, status }) => {
      // Convert ISO dates to timestamps
      const updates: any = { ...body };
      if (body.completed_at) {
        updates.completed_at = Math.floor(
          new Date(body.completed_at).getTime() / 1000
        );
      }
      if (body.canceled_at) {
        updates.canceled_at = Math.floor(
          new Date(body.canceled_at).getTime() / 1000
        );
      }

      const session = await dao.updateSession(sessionId, updates);
      if (!session) {
        return status(404, 'Session not found');
      }

      const lineItems = await dao.getLineItemsForSession(sessionId);
      return transformSession(session, lineItems);
    },
    {
      params: t.Object({ id: t.String(), sessionId: t.String() }),
      body: UpdateSessionSchema,
      response: {
        200: PracticeSessionInstanceSchema,
        404: t.String(),
      },
    }
  )
  .delete(
    '/:id/sessions/:sessionId',
    async ({ params: { sessionId } }) => {
      await dao.deleteSession(sessionId);
      return { success: true };
    },
    {
      params: t.Object({ id: t.String(), sessionId: t.String() }),
      response: t.Object({ success: t.Boolean() }),
    }
  )
  .put(
    '/:id/sessions/reorder',
    async ({ params: { id }, body }) => {
      const { sessionIds } = body;
      await dao.reorderSessions(id, sessionIds);
      const day = await dao.getDay(id);
      if (!day) {
        throw new Error('Day not found'); // Should exist
      }
      return resolveDayDetails(day);
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ sessionIds: t.Array(t.String()) }),
      response: DayInstanceSchema,
    }
  )
  // Line Items
  .post(
    '/:id/sessions/:sessionId/line-items',
    async ({ params: { sessionId }, body }) => {
      const item = await dao.createLineItem({
        practice_session_instance_id: sessionId,
        ...body,
      });
      return transformLineItem(item);
    },
    {
      params: t.Object({ id: t.String(), sessionId: t.String() }),
      body: CreateLineItemSchema,
      response: PracticeSessionInstanceLineItemSchema,
    }
  )
  .put(
    '/:id/sessions/:sessionId/line-items/:itemId',
    async ({ params: { itemId }, body, status }) => {
      const updates: any = { ...body };
      if (body.completed_at) {
        updates.completed_at = Math.floor(
          new Date(body.completed_at).getTime() / 1000
        );
      }
      if (body.is_completed !== undefined) {
        updates.is_completed = body.is_completed ? 1 : 0;
      }

      const item = await dao.updateLineItem(itemId, updates);
      if (!item) {
        return status(404, 'Line item not found');
      }
      return transformLineItem(item);
    },
    {
      params: t.Object({
        id: t.String(),
        sessionId: t.String(),
        itemId: t.String(),
      }),
      body: UpdateLineItemSchema,
      response: {
        200: PracticeSessionInstanceLineItemSchema,
        404: t.String(),
      },
    }
  )
  .delete(
    '/:id/sessions/:sessionId/line-items/:itemId',
    async ({ params: { itemId } }) => {
      await dao.deleteLineItem(itemId);
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String(),
        sessionId: t.String(),
        itemId: t.String(),
      }),
      response: t.Object({ success: t.Boolean() }),
    }
  )
  .put(
    '/:id/sessions/:sessionId/line-items/reorder',
    async ({ params: { sessionId }, body }) => {
      const { lineItemIds } = body;
      await dao.reorderLineItems(sessionId, lineItemIds);
      // Return list of items? Mock returns list.
      const items = await dao.getLineItemsForSession(sessionId);
      return items.map(transformLineItem);
    },
    {
      params: t.Object({ id: t.String(), sessionId: t.String() }),
      body: t.Object({ lineItemIds: t.Array(t.String()) }),
      response: t.Array(PracticeSessionInstanceLineItemSchema),
    }
  );
