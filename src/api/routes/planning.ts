import { Elysia, t } from 'elysia';
import { PlanningDAO } from '../../daos/PlanningDAO';
import { db } from '../../db';

const dao = new PlanningDAO(db);

const toISO = (ts: number | null | undefined) =>
  ts ? new Date(ts * 1000).toISOString() : null;

const PlanningItemSchema = t.Object({
  id: t.String(),
  display: t.String(),
  notes: t.Union([t.String(), t.Null()]),
  min_day_instance_id: t.Union([t.String(), t.Null()]),
  was_rejected: t.Boolean(),
  created_at: t.String(),
  updated_at: t.Union([t.String(), t.Null()]),
  completed_at: t.Union([t.String(), t.Null()]),
});

const CreatePlanningItemSchema = t.Object({
  display: t.String(),
  notes: t.Optional(t.String()),
  min_day_instance_id: t.Optional(t.String()),
});

const UpdatePlanningItemSchema = t.Object({
  display: t.Optional(t.String()),
  notes: t.Optional(t.String()),
  min_day_instance_id: t.Optional(t.Union([t.String(), t.Null()])),
  was_rejected: t.Optional(t.Boolean()),
  is_completed: t.Optional(t.Boolean()), // Client sends boolean
});

const transformItem = (item: any) => ({
  ...item,
  was_rejected: !!item.was_rejected,
  created_at: toISO(item.created_at) || new Date().toISOString(),
  updated_at: toISO(item.updated_at),
  completed_at: toISO(item.completed_at),
});

export const planningRoutes = new Elysia({ prefix: '/planning' })
  .use(
    new Elysia().model({
      planningItem: PlanningItemSchema,
    })
  )
  .get(
    '/',
    async ({ query }) => {
      const { asOfDate } = query;
      const date = asOfDate || new Date().toISOString().split('T')[0];
      const items = await dao.listActive(date);

      return items.map(transformItem);
    },
    {
      query: t.Object({
        asOfDate: t.Optional(t.String()),
      }),
      response: t.Array(PlanningItemSchema),
    }
  )
  .get(
    '/:id',
    async ({ params: { id }, status }) => {
      const item = await dao.get(id);
      if (!item) {
        return status(404, 'Item not found');
      }
      return transformItem(item);
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: PlanningItemSchema,
        404: t.String(),
      },
    }
  )
  .post(
    '/',
    async ({ body }) => {
      const item = await dao.create(body);
      return transformItem(item);
    },
    {
      body: CreatePlanningItemSchema,
      response: PlanningItemSchema,
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, status }) => {
      const updates: any = { ...body };

      // Handle boolean flags to DB values if necessary, but DAO takes specific fields.
      // DAO update signature: was_rejected?: number, completed_at?: number | null

      if (body.was_rejected !== undefined) {
        updates.was_rejected = body.was_rejected ? 1 : 0;
      }

      if (body.is_completed !== undefined) {
        updates.completed_at = body.is_completed
          ? Math.floor(Date.now() / 1000)
          : null;
        updates.is_completed = undefined;
      }

      const item = await dao.update(id, updates);
      if (!item) {
        return status(404, 'Item not found');
      }
      return transformItem(item);
    },
    {
      params: t.Object({ id: t.String() }),
      body: UpdatePlanningItemSchema,
      response: {
        200: PlanningItemSchema,
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
