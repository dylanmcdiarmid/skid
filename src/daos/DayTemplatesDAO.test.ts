import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb } from '../testutils';
import { DayTemplatesDAO } from './DayTemplatesDAO';

describe('DayTemplatesDAO', () => {
  let db: ReturnType<typeof createTestDb>;
  let dao: DayTemplatesDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new DayTemplatesDAO(db);
  });

  it('should create and retrieve a day template', async () => {
    const created = await dao.create({ display: 'Monday Routine' });

    expect(created.id).toBeString();
    expect(created.display).toBe('Monday Routine');

    const fetched = await dao.get(created.id);
    expect(fetched).toEqual(created);
  });

  it('should list day templates', async () => {
    await dao.create({ display: 'Day A' });
    await dao.create({ display: 'Day B' });

    const { items: list } = await dao.list();
    expect(list).toHaveLength(2);
  });

  it('should update a day template', async () => {
    const created = await dao.create({ display: 'Original' });
    const updated = await dao.update(created.id, { display: 'Updated' });

    expect(updated?.display).toBe('Updated');
    expect(updated?.updated_at).toBeTruthy();
  });

  it('should add sessions to a day template', async () => {
    const day = await dao.create({ display: 'Day A' });

    // We need a practice session template first to link.
    // Using raw insert to mock dependency or we could use SessionTemplatesDAO.
    const pstId = crypto.randomUUID();
    await db
      .insertInto('practice_session_templates')
      .values({
        id: pstId,
        unique_name: 'p1',
        display: 'P1',
      })
      .execute();

    const item = await dao.addSessionToDay({
      day_template_id: day.id,
      practice_session_template_id: pstId,
      recommended_time_minutes: 45,
      sort_order: 1,
    });

    expect(item.recommended_time_minutes).toBe(45);

    const items = await dao.getSessionsForDay(day.id);
    expect(items).toHaveLength(1);
    expect(items[0].practice_session_template_id).toBe(pstId);
  });
});
