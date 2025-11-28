# Initial API Design - Migration from Mock to Database

## Executive Summary

This document outlines the design for implementing a production API layer using Elysia with Eden and TypeBox, migrating from the current mock API stores to database-backed operations using existing DAOs.

**Stack**: Elysia + Eden + TypeBox + Kysely + bun sqlite

**Goal**: Replace mock stores in `client/src/api/` with real API endpoints while maintaining existing UI functionality with minimal disruption.

## Current State Analysis

### Database Schema (from migrations)

The database has four main domains:

1. **Templates Domain**
   - `practice_session_templates` - Reusable practice session definitions
   - `practice_session_line_items` - Line items within session templates
   - `day_templates` - Reusable day plans
   - `day_template_items` - Sessions within day templates
   - `practice_session_template_required_generators` - Generator requirements

2. **Instances Domain**
   - `day_instances` - Actual days (id = YYYY-MM-DD)
   - `practice_session_instances` - Actual practice sessions
   - `practice_session_instance_line_items` - Line items within session instances
   - `practice_session_instance_generated_values` - Generated values used in sessions

3. **Planning Domain**
   - `planning_items` - Todo/planning items with optional date constraints

4. **Generators Domain**
   - `generators` - Random value generators
   - `generator_history` - History of generated values

### Existing DAOs

Well-structured DAOs exist for all tables:
- `GeneratorsDAO` - CRUD + history tracking
- `SessionTemplatesDAO` - Templates, line items, required generators
- `DayTemplatesDAO` - Templates and template items
- `DayInstancesDAO` - Days, sessions, line items, generated values
- `PlanningDAO` - Planning items with query methods

**Key Observation**: DAOs are focused on individual table operations, not complex joined queries or business logic.

### Mock API Capabilities

The mock API (`client/src/api/`) provides rich functionality:

#### Common Patterns Across All Resources
- **Pagination**: `PagArgs { page, pageSize }` → `Pagination<T>`
- **Search**: Text search across relevant fields
- **Sorting**: `sortId` and `sortDir` (asc/desc)
- **Filtering**: Resource-specific (e.g., `showDisabled`)

#### Practice Sessions (`practice-sessions.ts`)
```typescript
- list(pagArgs, params?) → Pagination<PracticeSessionTemplate>
  - Search: display, unique_name
  - Sort: any field
  - Filter: showDisabled

- get(id) → PracticeSessionTemplate
  - Includes nested line_items[]
  - Computed field: last_touched (updated_at || created_at)

- create(data) → PracticeSessionTemplate
- update(id, data) → PracticeSessionTemplate
- delete(id) → { success, reason? }
```

#### Day Templates (`day-templates.ts`)
```typescript
- list(pagArgs, params?) → Pagination<DayTemplate>
  - Resolves practice_session_display via joins
  - Includes session_line_items in items

- get(id) → DayTemplate
  - Joins to resolve practice session details
  - Nested: items[] with session_line_items[]

- create(data) → DayTemplate
- update(id, data) → DayTemplate
- delete(id) → { success }
```

#### Day Instances (`day-instances.ts`)
```typescript
- list(pagArgs, params?) → Pagination<DayInstance>
  - Computed: actual_time_total (sum of sessions)
  - Computed: last_touched sorting option

- get(date) → DayInstance | null
  - Nested: sessions[] with line_items[]

- create(date) → DayInstance
- createFromTemplate(date, templateId) → DayInstance
  - Complex: copies template + sessions + line items

- update(date, data) → DayInstance
- updateSession(date, sessionId, data) → PracticeSessionInstance
  - Business logic: syncs display to template
  - Business logic: syncs recommended_time to day template

- updateLineItem(date, sessionId, lineItemId, data) → LineItem
  - Business logic: syncs to session template
  - Auto-sets completed_at when is_completed changes

- createLineItem(date, sessionId, data) → LineItem
  - Business logic: syncs to session template

- deleteLineItem(date, sessionId, lineItemId) → void
  - Business logic: syncs deletion to template

- reorderLineItems(date, sessionId, lineItemIds[]) → LineItem[]
  - Business logic: syncs order to template

- reorderSessions(date, sessionIds[]) → DayInstance
- deleteSession(date, sessionId) → void
- delete(date) → void
```

#### Generators (`generators.ts`)
```typescript
- list(pagArgs, params?) → Pagination<Generator>
  - Search: name, strategy, data_source
  - Sort: any field

- get(id) → Generator
- create(data) → Generator
- update(id, data) → Generator
- delete(id) → { success, reason? }
  - Business logic: prevents deletion if in use
```

### Addressing DAO Gaps
Currently we only have simple queries in our DAOs. We need to support nested updates, joins, transactions, and other complex queries. When we create a new API endpoint, we should be thinking about what queries should be added to the DAO to support that endpoint.

We should always use transactions for multi-step queries.

As we add new queries, we should recommend indexes if they don't already exist (we can add them to the initial migration "migrations/20251125034020_intial.sql")

### Addressing Validation Gaps
We should make sure we have clear validation, assisted by TypeBox schemas. We are currently using TypeScript types for the Mock API, we should use TypeBox schemas where appropriate.

### Computed Fields
Some fields can be computed at runtime or derived on the client side if we don't need them on the server side. For any derived fields, we should decide whether they actual need to be on the server side, and if not how we can elegantly and idiomatically have them on the client side.

### Common Types to Typebox
Common and shared types such as Pagination should be turned into TypeBox schemas.

Remember that the client and server code will always live in the same repo. As long as we write code that won't break our bundler, we can share code between the two.

### Tests
We have multiple examples of tests both for the client (custom qunit setup) and server side (bun test). We do not need E2E tests.


### Directory Structure

```
src/
├── index.tsx                    # Main Elysia app
├── api/
│   ├── routes/
│   │   ├── generators.ts        # /api/generators
│   │   ├── practice-sessions.ts # /api/practice-sessions
│   │   ├── day-templates.ts     # /api/day-templates
│   │   ├── day-instances.ts     # /api/day-instances
│   │   └── planning.ts          # /api/planning
│   ├── schemas/
│   │   ├── common.ts            # Pagination, PagArgs, etc.
│   │   ├── generators.ts        # Generator schemas
│   │   ├── practice-sessions.ts
│   │   ├── day-templates.ts
│   │   ├── day-instances.ts
│   │   └── planning.ts
│   └── services/
│       ├── GeneratorService.ts
│       ├── PracticeSessionService.ts
│       ├── DayTemplateService.ts
│       ├── DayInstanceService.ts
│       └── PlanningService.ts
├── daos/                        # Existing, will enhance
└── types/
    └── db.d.ts                  # Generated by kysely-codegen
```

### TypeBox Common Schemas

```typescript
// src/api/schemas/common.ts
import { Type } from '@sinclair/typebox';

export const PagArgs = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  pageSize: Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
});

export const Pagination = <T>(itemSchema: T) => Type.Object({
  items: Type.Array(itemSchema),
  totalItems: Type.Integer(),
  pageSize: Type.Integer(),
  currentPage: Type.Integer(),
  totalPages: Type.Integer(),
});

export const SortDirection = Type.Union([
  Type.Literal('asc'),
  Type.Literal('desc'),
]);

export const IdParam = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const SuccessResponse = Type.Object({
  success: Type.Boolean(),
  reason: Type.Optional(Type.String()),
});
```

### Example Route: Practice Sessions

```typescript
// src/api/routes/practice-sessions.ts
import { Elysia, t } from 'elysia';
import * as schemas from '../schemas/practice-sessions';
import { PracticeSessionService } from '../services/PracticeSessionService';

export const practiceSessionRoutes = (service: PracticeSessionService) =>
  new Elysia({ prefix: '/api/practice-sessions' })
    .get(
      '/',
      async ({ query }) => {
        return service.list(
          { page: query.page, pageSize: query.pageSize },
          {
            search: query.search,
            sortId: query.sortId,
            sortDir: query.sortDir,
            showDisabled: query.showDisabled,
          }
        );
      },
      {
        query: schemas.ListQuery,
        response: schemas.PaginatedResponse,
      }
    )
    .get(
      '/:id',
      async ({ params }) => {
        const session = await service.get(params.id);
        if (!session) {
          throw new Error('Not found'); // Will use Elysia error handler
        }
        return session;
      },
      {
        params: schemas.IdParam,
        response: schemas.PracticeSessionTemplate,
      }
    )
    .post(
      '/',
      async ({ body }) => {
        return service.create(body);
      },
      {
        body: schemas.CreatePracticeSession,
        response: schemas.PracticeSessionTemplate,
      }
    )
    .patch(
      '/:id',
      async ({ params, body }) => {
        return service.update(params.id, body);
      },
      {
        params: schemas.IdParam,
        body: schemas.UpdatePracticeSession,
        response: schemas.PracticeSessionTemplate,
      }
    )
    .delete(
      '/:id',
      async ({ params }) => {
        return service.delete(params.id);
      },
      {
        params: schemas.IdParam,
        response: schemas.DeleteResponse,
      }
    );
```

### Service Layer Pattern

Services handle business logic, computed fields, and orchestrate DAO calls:

```typescript
// src/api/services/PracticeSessionService.ts
import type { Kysely } from 'kysely';
import type { DB } from '../../types/db';
import { SessionTemplatesDAO } from '../../daos/SessionTemplatesDAO';

export class PracticeSessionService {
  private dao: SessionTemplatesDAO;

  constructor(private db: Kysely<DB>) {
    this.dao = new SessionTemplatesDAO(db);
  }

  async list(pagArgs: PagArgs, params?: SearchParams) {
    // 1. Query with filters
    let query = this.db
      .selectFrom('practice_session_templates as pst')
      .leftJoin('practice_session_line_items as li', 'pst.id', 'li.practice_session_template_id')
      .select([
        'pst.id',
        'pst.unique_name',
        'pst.display',
        'pst.default_recommended_time_minutes',
        'pst.disabled_at',
        'pst.created_at',
        'pst.updated_at',
      ])
      .groupBy('pst.id');

    // 2. Apply search filter
    if (params?.search) {
      query = query.where((eb) =>
        eb.or([
          eb('pst.display', 'like', `%${params.search}%`),
          eb('pst.unique_name', 'like', `%${params.search}%`),
        ])
      );
    }

    // 3. Apply disabled filter
    if (!params?.showDisabled) {
      query = query.where('pst.disabled_at', 'is', null);
    }

    // 4. Apply sorting
    if (params?.sortId) {
      const direction = params.sortDir === 'desc' ? 'desc' : 'asc';
      if (params.sortId === 'last_touched') {
        // Computed field
        query = query.orderBy(
          (eb) => eb.fn.coalesce('pst.updated_at', 'pst.created_at'),
          direction
        );
      } else {
        query = query.orderBy(`pst.${params.sortId}`, direction);
      }
    }

    // 5. Get total count
    const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('count'));
    const { count } = await countQuery.executeTakeFirstOrThrow();

    // 6. Apply pagination
    const offset = (pagArgs.page - 1) * pagArgs.pageSize;
    const items = await query.limit(pagArgs.pageSize).offset(offset).execute();

    // 7. Fetch line items for each session
    const enriched = await Promise.all(
      items.map(async (item) => {
        const line_items = await this.dao.getLineItems(item.id);
        return {
          ...item,
          line_items,
          last_touched: item.updated_at ?? item.created_at,
        };
      })
    );

    return {
      items: enriched,
      totalItems: Number(count),
      pageSize: pagArgs.pageSize,
      currentPage: pagArgs.page,
      totalPages: Math.ceil(Number(count) / pagArgs.pageSize),
    };
  }

  async get(id: string) {
    const template = await this.dao.get(id);
    if (!template) return null;

    const line_items = await this.dao.getLineItems(id);

    return {
      ...template,
      line_items,
      last_touched: template.updated_at ?? template.created_at,
    };
  }

  async create(data: CreateData) {
    // Use transaction
    return this.db.transaction().execute(async (trx) => {
      const dao = new SessionTemplatesDAO(trx);

      const template = await dao.create({
        unique_name: data.unique_name,
        display: data.display,
        default_recommended_time_minutes: data.default_recommended_time_minutes,
      });

      // Create line items
      const line_items = await Promise.all(
        (data.line_items || []).map((item, idx) =>
          dao.addLineItem({
            practice_session_template_id: template.id,
            display: item.display,
            title: item.title,
            sort_order: idx,
          })
        )
      );

      return {
        ...template,
        line_items,
        last_touched: template.created_at,
      };
    });
  }

  async update(id: string, data: UpdateData) {
    return this.db.transaction().execute(async (trx) => {
      const dao = new SessionTemplatesDAO(trx);

      // Update main template
      const template = await dao.update(id, {
        display: data.display,
        unique_name: data.unique_name,
        default_recommended_time_minutes: data.default_recommended_time_minutes,
        disabled_at: data.disabled_at,
      });

      if (!template) throw new Error('Template not found');

      // Handle line items if provided
      let line_items = await dao.getLineItems(id);

      if (data.line_items) {
        // Simple approach: delete all, recreate
        // (More sophisticated would be differential update)
        for (const li of line_items) {
          await dao.removeLineItem(li.id);
        }

        line_items = await Promise.all(
          data.line_items.map((item, idx) =>
            dao.addLineItem({
              practice_session_template_id: id,
              display: item.display,
              title: item.title,
              sort_order: idx,
            })
          )
        );
      }

      return {
        ...template,
        line_items,
        last_touched: template.updated_at ?? template.created_at,
      };
    });
  }

  async delete(id: string) {
    try {
      // Check if in use by checking foreign key references
      const inUse = await this.db
        .selectFrom('practice_session_instances')
        .select('id')
        .where('practice_session_template_id', '=', id)
        .limit(1)
        .executeTakeFirst();

      if (inUse) {
        return { success: false, reason: 'in_use' };
      }

      await this.dao.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, reason: 'error' };
    }
  }
}
```

### Day Instance Service - Complex Business Logic

The most complex service with nested operations and template syncing:

```typescript
// src/api/services/DayInstanceService.ts
export class DayInstanceService {
  private dao: DayInstancesDAO;
  private sessionDao: SessionTemplatesDAO;
  private dayTemplateDao: DayTemplatesDAO;

  constructor(private db: Kysely<DB>) {
    this.dao = new DayInstancesDAO(db);
    this.sessionDao = new SessionTemplatesDAO(db);
    this.dayTemplateDao = new DayTemplatesDAO(db);
  }

  async createFromTemplate(date: string, templateId: string) {
    return this.db.transaction().execute(async (trx) => {
      // 1. Create day instance
      const day = await new DayInstancesDAO(trx).createDay({
        id: date,
        source_day_template_id: templateId,
      });

      // 2. Get template with items
      const templateItems = await new DayTemplatesDAO(trx).getSessionsForDay(templateId);

      // 3. Create session instances
      for (const item of templateItems) {
        // Get session template
        const sessionTemplate = await new SessionTemplatesDAO(trx).get(
          item.practice_session_template_id
        );
        if (!sessionTemplate) continue;

        // Create session instance
        const session = await new DayInstancesDAO(trx).createSession({
          day_instance_id: date,
          practice_session_template_id: sessionTemplate.id,
          display: sessionTemplate.display,
          sort_order: item.sort_order,
          recommended_time_minutes: item.recommended_time_minutes,
        });

        // Get and create line items
        const lineItems = await new SessionTemplatesDAO(trx).getLineItems(sessionTemplate.id);

        for (const li of lineItems) {
          await new DayInstancesDAO(trx).createLineItem({
            practice_session_instance_id: session.id,
            source_line_item_id: li.id,
            display: li.display,
            title: li.title,
            sort_order: li.sort_order,
          });
        }
      }

      // 4. Return fully hydrated day instance
      return this.get(date);
    });
  }

  async updateLineItem(
    date: string,
    sessionId: string,
    lineItemId: string,
    data: UpdateLineItemData
  ) {
    return this.db.transaction().execute(async (trx) => {
      const dao = new DayInstancesDAO(trx);

      // Update the line item
      const updated = await dao.updateLineItem(lineItemId, {
        display: data.display,
        title: data.title,
        is_completed: data.is_completed ? 1 : 0,
        completed_at: data.is_completed ? Math.floor(Date.now() / 1000) : null,
        notes: data.notes,
      });

      if (!updated) throw new Error('Line item not found');

      // Sync to template if source exists
      if (updated.source_line_item_id && (data.display || data.title)) {
        await new SessionTemplatesDAO(trx).updateLineItem(
          updated.source_line_item_id,
          {
            display: data.display,
            title: data.title,
          }
        );
      }

      return updated;
    });
  }

  // ... similar patterns for other nested operations
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up TypeBox common schemas (pagination, sort, etc.)
- [ ] Create base service class with shared utilities
- [ ] Implement error handling middleware for Elysia
- [ ] Set up Eden Treaty client configuration
- [ ] Create database connection/context management

### Phase 2: Simple Resources (Week 1-2)
- [ ] Generators API (simplest - good starting point)
  - Routes, schemas, service layer
  - Pagination, search, sort
  - Delete with "in use" check
- [ ] Planning API (similar complexity)
  - Routes, schemas, service layer
  - Date filtering logic

### Phase 3: Template Resources (Week 2-3)
- [ ] Practice Session Templates API
  - Nested line items
  - Computed last_touched field
  - Line item CRUD operations
- [ ] Day Templates API
  - Joins to session templates
  - Nested items with line items
  - Template item management

### Phase 4: Instance Resources (Week 3-4)
- [ ] Day Instances API (most complex)
  - Deep nesting (day → sessions → line items)
  - createFromTemplate logic
  - All nested CRUD operations
  - Template syncing business logic
  - Reordering operations

### Phase 5: Client Integration (Week 4-5)
- [ ] Replace mock stores with Eden Treaty clients
- [ ] Update error handling in UI
- [ ] Test all existing UI flows
- [ ] Add loading states where needed
- [ ] Fix any TypeScript mismatches

### Phase 6: Enhancement (Week 5-6)
- [ ] Add proper validation error messages
- [ ] Implement rate limiting if needed
- [ ] Add API request logging
- [ ] Performance optimization (query indexes, N+1 queries)
- [ ] Add integration tests

## Technical Decisions

### Why Service Layer?
- **Separation of Concerns**: DAOs = data access, Services = business logic
- **Testability**: Can test business logic without database
- **Reusability**: Services can be used by multiple routes
- **Maintainability**: Clear responsibility boundaries

### Why Not Enhance DAOs Directly?
- DAOs should be thin wrappers over database operations
- Business logic (syncing templates, computed fields) doesn't belong in DAOs
- Services can compose multiple DAO calls in transactions
- Keeps DAOs focused and reusable

### Error Handling Strategy
```typescript
// Custom error classes
class NotFoundError extends Error {
  status = 404;
}

class ValidationError extends Error {
  status = 400;
}

class ConflictError extends Error {
  status = 409;
}

// Elysia error handler
app.onError(({ error, set }) => {
  if (error instanceof NotFoundError) {
    set.status = 404;
    return { error: error.message };
  }
  if (error instanceof ValidationError) {
    set.status = 400;
    return { error: error.message };
  }
  // ... etc
});
```

### Transaction Strategy
- **Always** use transactions for multi-step operations
- Services are responsible for transaction boundaries
- DAOs should accept both `Kysely<DB>` and `Transaction<DB>`

### Eden Treaty Setup
```typescript
// client/src/lib/api.ts
import { treaty } from '@elysiajs/eden';
import type { App } from '../../../src/index'; // Type import

export const api = treaty<App>('localhost:3000');

// Usage
const sessions = await api.api['practice-sessions'].get({
  query: {
    page: 1,
    pageSize: 20,
    search: 'guitar',
  },
});
```

## Migration Strategy

### Approach: Parallel Development
1. Keep mock stores functioning during development
2. Add feature flag to switch between mock and real API
3. Test each resource thoroughly before migration
4. Gradual rollout resource by resource

### Feature Flag Pattern
```typescript
// client/src/lib/api-client.ts
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

export const practiceSessionApi = USE_REAL_API
  ? new RealPracticeSessionClient()
  : mockPracticeSessionStore;
```

## Open Questions & Risks

### Questions
1. **Pagination Limits**: Should we enforce a max page size? (Suggest: 100)
2. **Soft Deletes**: Should we soft-delete templates instead of hard delete?
3. **Optimistic Updates**: Should we support ETags/optimistic concurrency control?
4. **File Uploads**: Generators have `data_source` - is this large text or files?
5. **Real-time Updates**: Do we need WebSocket support for collaborative editing?

### Risks
1. **N+1 Queries**: Day instances list with nested sessions/line items could be slow
   - Mitigation: Implement proper joins or pagination limits
2. **Template Sync Complexity**: The bidirectional syncing logic is complex and error-prone
   - Mitigation: Comprehensive tests, clear documentation
3. **Breaking Changes**: TypeBox validation might be stricter than mock API
   - Mitigation: Gradual rollout with feature flags
4. **Performance**: SQLite may struggle with complex joins on large datasets
   - Mitigation: Add indexes, consider denormalization if needed

## Performance Considerations

### Database Indexes
```sql
-- Suggested indexes for common queries
CREATE INDEX idx_practice_sessions_disabled ON practice_session_templates(disabled_at);
CREATE INDEX idx_practice_sessions_updated ON practice_session_templates(updated_at);
CREATE INDEX idx_day_instances_date ON day_instances(id); -- Already PK
CREATE INDEX idx_sessions_day ON practice_session_instances(day_instance_id);
CREATE INDEX idx_line_items_session ON practice_session_instance_line_items(practice_session_instance_id);
```

### Query Optimization
- Use `selectFrom` with specific columns instead of `selectAll` where possible
- Batch nested queries (e.g., DataLoader pattern for line items)
- Consider materialized views for complex computed fields
- Cache frequently accessed templates

## Testing Strategy

### Unit Tests
- Services with mocked DAOs
- Each business logic path
- Edge cases (empty results, null values)

### Integration Tests
- Full request/response cycle
- Database transactions
- Error handling

### E2E Tests
- Critical user flows with real API
- Template → Instance creation flow
- Nested updates and syncing

## Conclusion

This design provides a solid foundation for migrating from mock stores to a production API while maintaining backward compatibility with the existing UI. The service layer pattern keeps business logic organized and testable, while the gradual migration strategy minimizes risk.

**Next Steps**:
1. Review this document with the team
2. Answer open questions
3. Start Phase 1 implementation
4. Set up CI/CD for API tests
