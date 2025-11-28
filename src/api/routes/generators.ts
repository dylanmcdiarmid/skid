import { Elysia, type Static, t } from 'elysia';
import { GeneratorsDAO } from '../../daos/GeneratorsDAO';
import { db } from '../../db';
import { Pagination, SortDirectionSchema } from '../../types/schemas';

const dao = new GeneratorsDAO(db);

const GeneratorSchema = t.Object({
  id: t.String(),
  name: t.String(),
  strategy: t.Union([
    t.Literal('weighted_random'),
    t.Literal('random'),
    t.Literal('least_recently_used'),
  ]),
  data_source: t.Union([t.String(), t.Null()]),
});

type Generator = Static<typeof GeneratorSchema>;

const CreateGeneratorSchema = t.Object({
  name: t.String(),
  strategy: t.Union([
    t.Literal('weighted_random'),
    t.Literal('random'),
    t.Literal('least_recently_used'),
  ]),
  data_source: t.Optional(t.String()),
});

export const generatorsRoutes = new Elysia({ prefix: '/generators' })
  .use(
    new Elysia().model({
      generator: GeneratorSchema,
    })
  )
  .get(
    '/',
    async ({ query }) => {
      const { page, pageSize, search, sortId, sortDir } = query;
      const { items, totalItems } = await dao.list({
        page: page || 1,
        pageSize: pageSize || 20,
        search,
        sortId,
        sortDir,
      });

      return {
        items: items as Generator[], // Casting because DB types might be slightly different (null vs undefined)
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
      }),
      response: Pagination(GeneratorSchema),
    }
  )
  .get(
    '/:id',
    async ({ params: { id }, status }) => {
      const generator = await dao.get(id);
      if (!generator) {
        return status(404, 'Generator not found');
      }
      return generator as Generator;
    },
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: GeneratorSchema,
        404: t.String(),
      },
    }
  )
  .post(
    '/',
    async ({ body }) => {
      return (await dao.create(body)) as Generator;
    },
    {
      body: CreateGeneratorSchema,
      response: GeneratorSchema,
    }
  )
  .put(
    '/:id',
    async ({ params: { id }, body, status }) => {
      const updated = await dao.update(id, body);
      if (!updated) {
        return status(404, 'Generator not found');
      }
      return updated as Generator;
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Partial(CreateGeneratorSchema),
      response: {
        200: GeneratorSchema,
        404: t.String(),
      },
    }
  )
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      // Check if used? The DAO handles deletion but not the "in use" check business logic from the mock.
      // The mock had: if (generator?.name.includes('Rock')) return { success: false, reason: 'in_use' };
      // Real app should probably check relations.
      // I'll trust the database foreign keys for now, or add a check.
      // FKs will throw constraints if used.
      try {
        await dao.delete(id);
        return { success: true };
      } catch (_e) {
        return { success: false, reason: 'in_use' }; // Simplified
      }
    },
    {
      params: t.Object({ id: t.String() }),
      response: t.Object({
        success: t.Boolean(),
        reason: t.Optional(t.String()),
      }),
    }
  );
