import { faker } from '@faker-js/faker';
import { DevSettings } from '@/lib/dev-settings';
import type { PagArgs, Pagination } from '@/lib/utils';

export interface Generator {
  id: string;
  name: string;
  strategy: 'weighted_random' | 'random' | 'least_recently_used';
  data_source?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface GeneratorSearchParams {
  search?: string;
  sortId?: string;
  sortDir?: SortDirection;
}

class MockGeneratorStore {
  private generators: Generator[] = [];

  constructor() {
    this.generators = this.generateFakeGenerators(150);
  }

  generateFakeGenerators(count: number): Generator[] {
    return Array.from({ length: count }).map(() => ({
      id: faker.string.uuid(),
      name: faker.music.genre(),
      strategy: faker.helpers.arrayElement([
        'weighted_random',
        'random',
        'least_recently_used',
      ]),
      data_source: faker.lorem.paragraph(),
    }));
  }

  async list(
    pagArgs: PagArgs,
    params?: GeneratorSearchParams
  ): Promise<Pagination<Generator>> {
    // Simulate network delay
    await DevSettings.wait();

    let filtered = [...this.generators];
    // if (params?.search?.includes('Delete Me')) {
    //    console.log('Listing generators, total:', this.generators.length);
    //    console.log('Is Delete Me present?', this.generators.some(g => g.name === 'Delete Me'));
    // }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(search) ||
          g.strategy.toLowerCase().includes(search) ||
          g.data_source?.toLowerCase().includes(search)
      );
    }

    if (params?.sortId) {
      const { sortId, sortDir } = params;
      filtered.sort((a, b) => {
        const aVal = a[sortId as keyof Generator] ?? '';
        const bVal = b[sortId as keyof Generator] ?? '';

        if (aVal < bVal) {
          return sortDir === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortDir === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const start = (pagArgs.page - 1) * pagArgs.pageSize;
    const end = start + pagArgs.pageSize;

    return {
      items: filtered.slice(start, end),
      totalItems: filtered.length,
      pageSize: pagArgs.pageSize,
      currentPage: pagArgs.page,
      totalPages: Math.ceil(filtered.length / pagArgs.pageSize),
    };
  }

  async get(id: string): Promise<Generator> {
    const generator = this.generators.find((g) => g.id === id);
    if (!generator) {
      throw new Error('Generator not found');
    }
    return generator;
  }

  async create(data: Omit<Generator, 'id'>): Promise<Generator> {
    const newGenerator = {
      ...data,
      id: faker.string.uuid(),
    };
    this.generators.unshift(newGenerator);
    return newGenerator;
  }

  async update(
    id: string,
    data: Partial<Omit<Generator, 'id'>>
  ): Promise<Generator> {
    const index = this.generators.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error('Generator not found');
    }

    this.generators[index] = { ...this.generators[index], ...data };
    return this.generators[index];
  }

  async delete(id: string): Promise<{ success: boolean; reason?: string }> {
    // Simulate a check for "in use" generators
    // For demo purposes, let's say any generator with "Rock" in the name is in use
    const generator = this.generators.find((g) => g.id === id);
    if (generator?.name.includes('Rock')) {
      return { success: false, reason: 'in_use' };
    }

    const index = this.generators.findIndex((g) => g.id === id);
    if (index === -1) {
      throw new Error('Generator not found');
    }

    this.generators.splice(index, 1);
    return { success: true };
  }

  // For testing/resetting
  reset() {
    this.generators = this.generateFakeGenerators(150);
  }
}

export const mockGeneratorStore = new MockGeneratorStore();
