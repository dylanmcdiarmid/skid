import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb } from '../testutils';
import { PlanningDAO } from './PlanningDAO';

describe('PlanningDAO', () => {
  let db: ReturnType<typeof createTestDb>;
  let dao: PlanningDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new PlanningDAO(db);
  });

  it('should create and list active items', async () => {
    const active = await dao.create({ display: 'Active Task' });
    await dao.create({
      display: 'Snoozed Task',
      min_day_instance_id: '2025-01-01',
    });

    const today = '2023-10-01';

    const items = await dao.listActive(today);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(active.id);

    // If we fast forward time
    const futureItems = await dao.listActive('2025-01-02');
    expect(futureItems).toHaveLength(2);
  });

  it('should snooze items', async () => {
    const task = await dao.create({ display: 'Task' });

    await dao.snooze(task.id, '2099-01-01');
    const items = await dao.listActive('2023-10-01');
    expect(items).toHaveLength(0);
  });

  it('should reject items', async () => {
    const task = await dao.create({ display: 'Bad Idea' });
    await dao.reject(task.id);

    const items = await dao.listActive('2023-10-01');
    expect(items).toHaveLength(0);

    const fetched = await dao.get(task.id);
    expect(fetched?.was_rejected).toBe(1);
    expect(fetched?.updated_at).toBeTruthy();
  });

  it('should complete items', async () => {
    const task = await dao.create({ display: 'Done' });
    await dao.complete(task.id);

    const items = await dao.listActive('2023-10-01');
    expect(items).toHaveLength(0);

    const fetched = await dao.get(task.id);
    expect(fetched?.completed_at).toBeTruthy();
    expect(fetched?.updated_at).toBeTruthy();
  });
});
