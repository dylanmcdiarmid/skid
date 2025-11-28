import { client } from '@/lib/api-client';
import type { PagArgs, Pagination } from '@/lib/utils';

export interface PracticeSessionLineItem {
  id: string;
  title: string | null;
  display: string;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface PracticeSessionTemplate {
  id: string;
  unique_name: string;
  display: string;
  default_recommended_time_minutes: number;
  line_items: PracticeSessionLineItem[];
  disabled_at: string | null;
  created_at: string;
  updated_at: string | null;
  last_touched: string;
}

export type SortDirection = 'asc' | 'desc';

export interface PracticeSessionSearchParams {
  search?: string;
  sortId?: string;
  sortDir?: SortDirection;
  showDisabled?: boolean;
}

export const practiceSessionStore = {
  async list(
    pagArgs: PagArgs,
    params?: PracticeSessionSearchParams
  ): Promise<Pagination<PracticeSessionTemplate>> {
    const { data, error } = await client.api['practice-sessions'].get({
      query: {
        page: pagArgs.page,
        pageSize: pagArgs.pageSize,
        search: params?.search,
        sortId: params?.sortId,
        sortDir: params?.sortDir,
        showDisabled: params?.showDisabled,
      },
    });

    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }

    return data as Pagination<PracticeSessionTemplate>;
  },

  async get(id: string): Promise<PracticeSessionTemplate> {
    const { data, error } = await client.api['practice-sessions']({ id }).get();
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as PracticeSessionTemplate;
  },

  async create(
    data: Omit<
      PracticeSessionTemplate,
      'id' | 'created_at' | 'updated_at' | 'last_touched' | 'disabled_at'
    >
  ): Promise<PracticeSessionTemplate> {
    const { data: created, error } = await client.api['practice-sessions'].post(
      {
        unique_name: data.unique_name,
        display: data.display,
        default_recommended_time_minutes: data.default_recommended_time_minutes,
        line_items: data.line_items.map((li) => ({
          title: li.title || undefined, // Handle null vs undefined mismatch if any
          display: li.display,
          sort_order: li.sort_order,
        })),
      }
    );

    if (error) {
      throw error;
    }
    if (!created) {
      throw new Error('No data returned');
    }
    return created as PracticeSessionTemplate;
  },

  async update(
    id: string,
    data: Partial<
      Omit<
        PracticeSessionTemplate,
        'id' | 'created_at' | 'updated_at' | 'last_touched'
      >
    >
  ): Promise<PracticeSessionTemplate> {
    const { data: updated, error } = await client.api['practice-sessions']({
      id,
    }).put({
      unique_name: data.unique_name,
      display: data.display,
      default_recommended_time_minutes: data.default_recommended_time_minutes,
      line_items: data.line_items?.map((li) => ({
        id: li.id,
        title: li.title || undefined,
        display: li.display,
        sort_order: li.sort_order,
      })),
      disabled_at: data.disabled_at,
    });

    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as PracticeSessionTemplate;
  },

  async delete(id: string): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await client.api['practice-sessions']({
      id,
    }).delete();
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data;
  },
};

export const mockPracticeSessionStore = practiceSessionStore;
