import { client } from '@/lib/api-client';
import type { PagArgs, Pagination } from '@/lib/utils';

export interface Generator {
  id: string;
  name: string;
  strategy: 'weighted_random' | 'random' | 'least_recently_used';
  data_source: string | null;
}

export type SortDirection = 'asc' | 'desc';

export interface GeneratorSearchParams {
  search?: string;
  sortId?: string;
  sortDir?: SortDirection;
}

export const generatorStore = {
  async list(
    pagArgs: PagArgs,
    params?: GeneratorSearchParams
  ): Promise<Pagination<Generator>> {
    const { data, error } = await client.api.generators.get({
      query: {
        page: pagArgs.page,
        pageSize: pagArgs.pageSize,
        search: params?.search,
        sortId: params?.sortId,
        sortDir: params?.sortDir,
      },
    });

    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }

    return data as Pagination<Generator>;
  },

  async get(id: string): Promise<Generator> {
    const { data, error } = await client.api.generators({ id }).get();
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as Generator;
  },

  async create(data: Omit<Generator, 'id'>): Promise<Generator> {
    const { data: created, error } = await client.api.generators.post({
      name: data.name,
      strategy: data.strategy,
      data_source: data.data_source ?? undefined,
    });
    if (error) {
      throw error;
    }
    if (!created) {
      throw new Error('No data returned');
    }
    return created as Generator;
  },

  async update(
    id: string,
    data: Partial<Omit<Generator, 'id'>>
  ): Promise<Generator> {
    const { data: updated, error } = await client.api.generators({ id }).put({
      name: data.name,
      strategy: data.strategy,
      data_source: data.data_source ?? undefined,
    });
    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as Generator;
  },

  async delete(id: string): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await client.api.generators({ id }).delete();
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data;
  },
};
