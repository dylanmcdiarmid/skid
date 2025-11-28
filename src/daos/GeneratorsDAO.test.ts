import { beforeEach, describe, expect, it } from 'bun:test';
import { createTestDb } from '../testutils';
import { GeneratorsDAO } from './GeneratorsDAO';

describe('GeneratorsDAO', () => {
  let db: ReturnType<typeof createTestDb>;
  let dao: GeneratorsDAO;

  beforeEach(() => {
    db = createTestDb();
    dao = new GeneratorsDAO(db);
  });

  it('should create and list generators', async () => {
    const g1 = await dao.create({
      name: 'Keys',
      strategy: 'random',
      data_source: 'C,G,D',
    });
    await dao.create({ name: 'BPM', strategy: 'range' });

    const { items: list } = await dao.list();
    expect(list).toHaveLength(2);
    expect(list.find((g) => g.id === g1.id)).toBeTruthy();
  });

  it('should log and retrieve history', async () => {
    const g = await dao.create({ name: 'Keys', strategy: 'random' });

    await dao.logHistory({
      generator_id: g.id,
      value_generated: 'C Major',
      picked_at: 1000,
    });

    await dao.logHistory({
      generator_id: g.id,
      value_generated: 'G Major',
      picked_at: 2000,
    });

    const history = await dao.getHistory(g.id);
    expect(history).toHaveLength(2);
    // Descending order
    expect(history[0].value_generated).toBe('G Major');
    expect(history[1].value_generated).toBe('C Major');
  });
});
