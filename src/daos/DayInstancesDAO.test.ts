import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb } from '../testutils';
import { DayInstancesDAO } from './DayInstancesDAO';

describe('DayInstancesDAO', () => {
  let db: ReturnType<typeof createTestDb>;
  let dao: DayInstancesDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new DayInstancesDAO(db);
  });

  it('should create and retrieve a day instance', async () => {
    const date = '2023-10-25';
    const created = await dao.createDay({
      id: date,
      notes: 'Good day',
    });

    expect(created.id).toBe(date);
    expect(created.notes).toBe('Good day');

    const fetched = await dao.getDay(date);
    expect(fetched).toEqual(created);
  });

  it('should manage session instances', async () => {
    const date = '2023-10-26';
    await dao.createDay({ id: date });

    const session = await dao.createSession({
      day_instance_id: date,
      display: 'Morning Practice',
      recommended_time_minutes: 30,
    });

    expect(session.display).toBe('Morning Practice');

    const sessions = await dao.getSessionsForDay(date);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(session.id);

    const updated = await dao.updateSession(session.id, {
      actual_time_spent_minutes: 35,
      completed_at: Date.now(),
    });
    expect(updated?.actual_time_spent_minutes).toBe(35);
    expect(updated?.completed_at).toBeTruthy();
  });

  it('should manage line item instances', async () => {
    const date = '2023-10-27';
    await dao.createDay({ id: date });
    const session = await dao.createSession({
      day_instance_id: date,
      display: 'S1',
    });

    const item = await dao.createLineItem({
      practice_session_instance_id: session.id,
      display: 'Scale C Major',
    });

    const items = await dao.getLineItemsForSession(session.id);
    expect(items).toHaveLength(1);
    expect(items[0].display).toBe('Scale C Major');

    const updated = await dao.updateLineItem(item.id, {
      is_completed: 1,
      completed_at: Date.now(),
    });
    expect(updated?.is_completed).toBe(1);
  });

  it('should manage generated values', async () => {
    const date = '2023-10-28';
    await dao.createDay({ id: date });
    const session = await dao.createSession({
      day_instance_id: date,
      display: 'S1',
    });

    await dao.createGeneratedValue({
      practice_session_instance_id: session.id,
      display_value: 'C# Minor',
    });

    const values = await dao.getGeneratedValuesForSession(session.id);
    expect(values).toHaveLength(1);
    expect(values[0].display_value).toBe('C# Minor');
  });
});
