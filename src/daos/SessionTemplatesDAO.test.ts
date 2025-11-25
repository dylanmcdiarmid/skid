import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb } from '../testutils';
import { SessionTemplatesDAO } from './SessionTemplatesDAO';

describe('SessionTemplatesDAO', () => {
  let db: ReturnType<typeof createTestDb>;
  let dao: SessionTemplatesDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new SessionTemplatesDAO(db);
  });

  it('should create and retrieve a session template', async () => {
    const created = await dao.create({
      unique_name: 'piano-scales',
      display: 'Piano Scales',
    });

    expect(created.id).toBeString();
    expect(created.unique_name).toBe('piano-scales');
    expect(created.default_recommended_time_minutes).toBe(30);

    const fetched = await dao.get(created.id);
    expect(fetched).toEqual(created);
  });

  it('should list templates', async () => {
    await dao.create({ unique_name: 't1', display: 'T1' });
    await dao.create({ unique_name: 't2', display: 'T2' });

    const list = await dao.list();
    expect(list).toHaveLength(2);
  });

  it('should update a template', async () => {
    const created = await dao.create({
      unique_name: 't1',
      display: 'T1',
    });

    const updated = await dao.update(created.id, { display: 'Updated T1' });
    expect(updated?.display).toBe('Updated T1');
  });

  it('should add and list line items', async () => {
    const template = await dao.create({ unique_name: 't1', display: 'T1' });

    await dao.addLineItem({
      practice_session_template_id: template.id,
      display: 'Item 1',
      sort_order: 1,
    });

    await dao.addLineItem({
      practice_session_template_id: template.id,
      display: 'Item 2',
      sort_order: 2,
    });

    const items = await dao.getLineItems(template.id);
    expect(items).toHaveLength(2);
    expect(items[0].display).toBe('Item 1');
    expect(items[1].display).toBe('Item 2');
  });

  it('should add and remove required generators', async () => {
    const template = await dao.create({ unique_name: 't1', display: 'T1' });

    // Need a generator first (mocking via raw insert for isolation if needed,
    // but ideally we should use GeneratorsDAO or raw insert.
    // Since we are in SessionTemplatesDAO test, I'll just insert raw to keep it focused or assuming FK constraints.)

    const genId = crypto.randomUUID();
    await db
      .insertInto('generators')
      .values({
        id: genId,
        name: 'Scales',
        strategy: 'random',
      })
      .execute();

    const reqGen = await dao.addRequiredGenerator({
      practice_session_template_id: template.id,
      generator_id: genId,
      label: 'Key',
    });

    const fetched = await dao.getRequiredGenerators(template.id);
    expect(fetched).toHaveLength(1);
    expect(fetched[0].label).toBe('Key');

    await dao.removeRequiredGenerator(reqGen.id);
    const fetchedAfter = await dao.getRequiredGenerators(template.id);
    expect(fetchedAfter).toHaveLength(0);
  });
});
