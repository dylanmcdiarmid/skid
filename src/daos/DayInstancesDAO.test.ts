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

  it('should create day instance from template', async () => {
    // Setup template data
    const templateId = 'template-1';
    const sessionTemplateId = 'session-template-1';
    const lineItemTemplateId = 'line-item-template-1';

    await db.insertInto('day_templates').values({
        id: templateId,
        display: 'Test Template',
        created_at: Math.floor(Date.now() / 1000),
    }).execute();

    await db.insertInto('practice_session_templates').values({
        id: sessionTemplateId,
        display: 'Session Template',
        unique_name: 'session-1',
        default_recommended_time_minutes: 10,
        created_at: Math.floor(Date.now() / 1000),
    }).execute();

    await db.insertInto('day_template_items').values({
        id: 'dti-1',
        day_template_id: templateId,
        practice_session_template_id: sessionTemplateId,
        sort_order: 0,
    }).execute();

    await db.insertInto('practice_session_line_items').values({
        id: lineItemTemplateId,
        practice_session_template_id: sessionTemplateId,
        display: 'Line Item Template',
        sort_order: 0,
        created_at: Math.floor(Date.now() / 1000),
    }).execute();

    // Execute
    const date = '2023-11-01';
    const dayInstance = await dao.createFromTemplate(date, templateId);

    // Verify
    expect(dayInstance).toBeDefined();
    expect(dayInstance.id).toBe(date);
    expect(dayInstance.source_day_template_id).toBe(templateId);

    const sessions = await dao.getSessionsForDay(date);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].display).toBe('Session Template');
    expect(sessions[0].practice_session_template_id).toBe(sessionTemplateId);

    const lineItems = await dao.getLineItemsForSession(sessions[0].id);
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0].display).toBe('Line Item Template');
    expect(lineItems[0].source_line_item_id).toBe(lineItemTemplateId);
  });

  it('should handle templates with generators safely', async () => {
    const templateId = 'template-gen';
    const sessionTemplateId = 'session-template-gen';
    const generatorId = 'gen-1';

    await db.insertInto('day_templates').values({
        id: templateId,
        display: 'Template with Generator',
        created_at: Math.floor(Date.now() / 1000),
    }).execute();

    await db.insertInto('practice_session_templates').values({
        id: sessionTemplateId,
        display: 'Session with Generator',
        unique_name: 'session-gen',
        default_recommended_time_minutes: 10,
        created_at: Math.floor(Date.now() / 1000),
    }).execute();

    await db.insertInto('generators').values({
        id: generatorId,
        name: 'Test Generator',
        strategy: 'random',
        data_source: '["A", "B"]',
    }).execute();

    await db.insertInto('practice_session_template_required_generators').values({
        id: 'req-1',
        practice_session_template_id: sessionTemplateId,
        generator_id: generatorId,
        quantity: 1,
    }).execute();

    await db.insertInto('day_template_items').values({
        id: 'dti-gen',
        day_template_id: templateId,
        practice_session_template_id: sessionTemplateId,
        sort_order: 0,
    }).execute();

    const date = '2023-11-02';
    const dayInstance = await dao.createFromTemplate(date, templateId);

    expect(dayInstance).toBeDefined();
    const sessions = await dao.getSessionsForDay(date);
    expect(sessions).toHaveLength(1);

    // Currently we expect NO generated values to be created automatically
    const generatedValues = await dao.getGeneratedValuesForSession(sessions[0].id);
    expect(generatedValues).toHaveLength(0);
  });
});
