import { Elysia } from 'elysia';
import { generatorsRoutes } from './routes/generators';
import { practiceSessionsRoutes } from './routes/practice-sessions';
import { dayTemplatesRoutes } from './routes/day-templates';
import { dayInstancesRoutes } from './routes/day-instances';
import { planningRoutes } from './routes/planning';

export const api = new Elysia({ prefix: '/api' })
  .onError(({ code, error, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { success: false, message: 'Not found' };
    }
    console.error(error);
    set.status = 500;
    return { success: false, message: 'Internal Server Error' };
  })
  .get('/health', () => ({ status: 'ok' }))
  .use(generatorsRoutes)
  .use(practiceSessionsRoutes)
  .use(dayTemplatesRoutes)
  .use(dayInstancesRoutes)
  .use(planningRoutes);

export type App = typeof api;
