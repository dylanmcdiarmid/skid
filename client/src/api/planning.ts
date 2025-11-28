import { client } from '@/lib/api-client';

export interface PlanningItem {
  id: string;
  display: string;
  notes: string | null;
  min_day_instance_id: string | null;
  was_rejected: boolean;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
}

export const planningStore = {
  async listActive(asOfDate?: string): Promise<PlanningItem[]> {
    const { data, error } = await client.api.planning.get({
      query: { asOfDate },
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error('No data returned');
    }
    return data as PlanningItem[];
  },

  async create(data: {
    display: string;
    notes?: string;
    min_day_instance_id?: string;
  }): Promise<PlanningItem> {
    const { data: created, error } = await client.api.planning.post(data);
    if (error) {
      throw error;
    }
    if (!created) {
      throw new Error('No data returned');
    }
    return created as PlanningItem;
  },

  async update(
    id: string,
    data: Partial<PlanningItem> & { is_completed?: boolean }
  ): Promise<PlanningItem> {
    // Map client type to API input type if needed, but strict type check might complain about extra fields
    // TypeBox schema: display?, notes?, min_day_instance_id?, was_rejected?, is_completed?
    // Partial<PlanningItem> includes id, created_at etc which are NOT in schema.
    // I should pick fields.

    const payload: any = {};
    if (data.display !== undefined) {
      payload.display = data.display;
    }
    if (data.notes !== undefined) {
      payload.notes = data.notes || undefined; // Handle null
    }
    if (data.min_day_instance_id !== undefined) {
      payload.min_day_instance_id = data.min_day_instance_id || undefined;
    }
    if (data.was_rejected !== undefined) {
      payload.was_rejected = data.was_rejected;
    }
    if (data.is_completed !== undefined) {
      payload.is_completed = data.is_completed;
    }

    const { data: updated, error } = await client.api
      .planning({ id })
      .put(payload);
    if (error) {
      throw error;
    }
    if (!updated) {
      throw new Error('No data returned');
    }
    return updated as PlanningItem;
  },

  async delete(id: string): Promise<void> {
    const { error } = await client.api.planning({ id }).delete();
    if (error) {
      throw error;
    }
  },
};
