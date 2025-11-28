import { client } from '@/lib/api-client';
import type { PagArgs, Pagination } from '@/lib/utils';

export interface PracticeSessionInstanceLineItem {
  id: string;
  practice_session_instance_id: string;
  source_line_item_id: string | null;
  title: string | null;
  display: string;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string | null;
  notes: string | null;
}

export interface PracticeSessionInstance {
  id: string;
  day_instance_id: string;
  practice_session_template_id: string | null;
  display: string;
  sort_order: number;
  recommended_time_minutes: number | null;
  actual_time_spent_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  line_items: PracticeSessionInstanceLineItem[];
}

export interface DayInstance {
  id: string; // YYYY-MM-DD
  source_day_template_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  sessions: PracticeSessionInstance[];
  actual_time_total: number;
}

export const dayInstanceStore = {
  async list(
    pagArgs: PagArgs,
    params?: { search?: string; sortId?: string; sortDir?: 'asc' | 'desc' }
  ): Promise<Pagination<DayInstance>> {
    const { data, error } = await client.api['day-instances'].get({
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

    return data as Pagination<DayInstance>;
  },

  async get(date: string): Promise<DayInstance | null> {
    const { data, error } = await client.api['day-instances']({
      id: date,
    }).get();
    if (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
    if (!data) {
      return null;
    }
    return data as DayInstance;
  },

  async create(date: string): Promise<DayInstance> {
    const { data, error } = await client.api['day-instances'].post({
      id: date,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as DayInstance;
  },

  async createFromTemplate(
    date: string,
    templateId: string
  ): Promise<DayInstance> {
    const { data, error } = await client.api['day-instances'].post({
      id: date,
      source_day_template_id: templateId,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as DayInstance;
  },

  async update(date: string, data: Partial<DayInstance>): Promise<DayInstance> {
    const { data: updated, error } = await client.api['day-instances']({
      id: date,
    }).put({
      notes: data.notes ?? undefined,
    });
    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as DayInstance;
  },

  async updateSession(
    date: string,
    sessionId: string,
    data: Partial<PracticeSessionInstance>
  ): Promise<PracticeSessionInstance> {
    const { data: updated, error } = await client.api['day-instances']({
      id: date,
    })
      .sessions({ sessionId })
      .put({
        display: data.display,
        sort_order: data.sort_order,
        actual_time_spent_minutes: data.actual_time_spent_minutes,
        notes: data.notes || undefined,
        completed_at: data.completed_at || undefined,
        canceled_at: data.canceled_at || undefined,
        recommended_time_minutes: data.recommended_time_minutes || undefined,
      });
    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as PracticeSessionInstance;
  },

  async updateLineItem(
    date: string,
    sessionId: string,
    lineItemId: string,
    data: Partial<PracticeSessionInstanceLineItem>
  ): Promise<PracticeSessionInstanceLineItem> {
    const { data: updated, error } = await client.api['day-instances']({
      id: date,
    })
      .sessions({ sessionId })
      ['line-items']({ itemId: lineItemId })
      .put({
        display: data.display,
        title: data.title || undefined,
        sort_order: data.sort_order,
        is_completed: data.is_completed,
        completed_at: data.completed_at || undefined,
        notes: data.notes || undefined,
      });
    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as PracticeSessionInstanceLineItem;
  },

  async createLineItem(
    date: string,
    sessionId: string,
    data: Partial<PracticeSessionInstanceLineItem>
  ): Promise<PracticeSessionInstanceLineItem> {
    const { data: created, error } = await client.api['day-instances']({
      id: date,
    })
      .sessions({ sessionId })
      ['line-items'].post({
        display: data.display || '',
        title: data.title || undefined,
        source_line_item_id: data.source_line_item_id || undefined,
        sort_order: data.sort_order,
        notes: data.notes || undefined,
      });
    if (error) {
      throw error;
    }
    if (!created) {
      throw new Error('No data returned');
    }
    return created as PracticeSessionInstanceLineItem;
  },

  async deleteLineItem(
    date: string,
    sessionId: string,
    lineItemId: string
  ): Promise<void> {
    const { error } = await client.api['day-instances']({ id: date })
      .sessions({ sessionId })
      ['line-items']({ itemId: lineItemId })
      .delete();
    if (error) {
      throw error;
    }
  },

  async reorderLineItems(
    date: string,
    sessionId: string,
    lineItemIds: string[]
  ): Promise<PracticeSessionInstanceLineItem[]> {
    const { data, error } = await client.api['day-instances']({ id: date })
      .sessions({ sessionId })
      ['line-items'].reorder.put({
        lineItemIds,
      });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as PracticeSessionInstanceLineItem[];
  },

  async reorderSessions(
    date: string,
    sessionIds: string[]
  ): Promise<DayInstance> {
    const { data, error } = await client.api['day-instances']({
      id: date,
    }).sessions.reorder.put({
      sessionIds,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as DayInstance;
  },

  async deleteSession(date: string, sessionId: string): Promise<void> {
    const { error } = await client.api['day-instances']({ id: date })
      .sessions({ sessionId })
      .delete();
    if (error) {
      throw error;
    }
  },

  async delete(date: string): Promise<void> {
    const { error } = await client.api['day-instances']({ id: date }).delete();
    if (error) {
      throw error;
    }
  },
};

export const mockDayInstanceStore = dayInstanceStore;
