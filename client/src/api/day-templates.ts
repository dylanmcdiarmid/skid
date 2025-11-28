import { client } from '@/lib/api-client';
import type { PagArgs, Pagination } from '@/lib/utils';
import type { PracticeSessionLineItem } from './practice-sessions';

export interface DayTemplateItem {
  id: string;
  practice_session_template_id: string;
  practice_session_display?: string;
  recommended_time_minutes: number;
  sort_order: number;
  session_line_items: PracticeSessionLineItem[];
}

export interface DayTemplate {
  id: string;
  display: string;
  items: DayTemplateItem[];
  disabled_at: string | null;
  created_at: string;
  updated_at: string | null;
  last_touched: string;
}

export type SortDirection = 'asc' | 'desc';

export interface DayTemplateSearchParams {
  search?: string;
  sortId?: string;
  sortDir?: SortDirection;
  showDisabled?: boolean;
}

export const dayTemplateStore = {
  async list(
    pagArgs: PagArgs,
    params?: DayTemplateSearchParams
  ): Promise<Pagination<DayTemplate>> {
    const { data, error } = await client.api['day-templates'].get({
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

    return data as Pagination<DayTemplate>;
  },

  async get(id: string): Promise<DayTemplate> {
    const { data, error } = await client.api['day-templates']({ id }).get();
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as DayTemplate;
  },

  async create(
    data: Omit<DayTemplate, 'id' | 'created_at' | 'updated_at' | 'last_touched'>
  ): Promise<DayTemplate> {
    const { data: created, error } = await client.api['day-templates'].post({
      display: data.display,
      items: data.items.map((item) => ({
        practice_session_template_id: item.practice_session_template_id,
        recommended_time_minutes: item.recommended_time_minutes,
        sort_order: item.sort_order,
      })),
    });
    if (error) {
      throw error;
    }
    if (!created) {
      throw new Error('No data returned');
    }
    return created as DayTemplate;
  },

  async update(
    id: string,
    data: Partial<
      Omit<DayTemplate, 'id' | 'created_at' | 'updated_at' | 'last_touched'>
    >
  ): Promise<DayTemplate> {
    const { data: updated, error } = await client.api['day-templates']({
      id,
    }).put({
      display: data.display,
      items: data.items?.map((item) => ({
        practice_session_template_id: item.practice_session_template_id,
        recommended_time_minutes: item.recommended_time_minutes,
        sort_order: item.sort_order,
      })),
    });
    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as DayTemplate;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const { data, error } = await client.api['day-templates']({ id }).delete();
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data;
  },
};

export const mockDayTemplateStore = dayTemplateStore;
