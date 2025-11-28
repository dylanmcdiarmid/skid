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

  it('should update a day instance', async () => {
    const date = '2023-10-25';
    await dao.createDay({
      id: date,
      notes: 'Initial note',
    });

    const updated = await dao.updateDay(date, { notes: 'Updated note' });
    expect(updated?.notes).toBe('Updated note');
    expect(updated?.updated_at).toBeTruthy();
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
    expect(updated?.updated_at).toBeTruthy();
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
    expect(updated?.updated_at).toBeTruthy();
  });

  it('should create line item with optional title', async () => {
    const date = '2023-10-29';
    await dao.createDay({ id: date });
    const session = await dao.createSession({
      day_instance_id: date,
      display: 'S1',
    });

    const itemWithTitle = await dao.createLineItem({
      practice_session_instance_id: session.id,
      display: 'Practice Hanon Exercise 1',
      title: 'Hanon',
    });

    const itemWithoutTitle = await dao.createLineItem({
      practice_session_instance_id: session.id,
      display: 'Practice Scales',
    });

    expect(itemWithTitle.title).toBe('Hanon');
    expect(itemWithoutTitle.title).toBeNull();

    const items = await dao.getLineItemsForSession(session.id);
    expect(items[0].title).toBe('Hanon');
    expect(items[1].title).toBeNull();
  });

  it('should update line item title', async () => {
    const date = '2023-10-30';
    await dao.createDay({ id: date });
    const session = await dao.createSession({
      day_instance_id: date,
      display: 'S1',
    });

    const item = await dao.createLineItem({
      practice_session_instance_id: session.id,
      display: 'Some item',
    });

    expect(item.title).toBeNull();

    const updated = await dao.updateLineItem(item.id, { title: 'New Title' });
    expect(updated?.title).toBe('New Title');
    expect(updated?.updated_at).toBeTruthy();

    const cleared = await dao.updateLineItem(item.id, { title: null });
    expect(cleared?.title).toBeNull();
    expect(cleared?.updated_at).toBeTruthy();
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
