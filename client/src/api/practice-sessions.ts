import { faker } from '@faker-js/faker';
import { createDateStepGenerator } from '@/api/utils';
import { DevSettings } from '@/lib/dev-settings';
import type { PagArgs, Pagination } from '@/lib/utils';

export interface PracticeSessionLineItem {
  id: string;
  title: string;
  display: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface PracticeSessionTemplate {
  id: string;
  unique_name: string;
  display: string;
  default_recommended_time_minutes: number;
  line_items: PracticeSessionLineItem[];
  disabled_at: string | null; // ISO Date string or null
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

class MockPracticeSessionStore {
  private readonly sessions: PracticeSessionTemplate[] = [];

  constructor() {
    this.sessions = this.generateFakeSessions(20);
  }

  generateFakeSessions(count: number): PracticeSessionTemplate[] {
    const dateGenerator = createDateStepGenerator(
      new Date('2024-01-01'),
      new Date(),
      count
    );

    return Array.from({ length: count }).map(() => {
      const createdDate = dateGenerator.next();
      const created_at = createdDate.toISOString();
      const updatedDate = faker.datatype.boolean({ probability: 0.3 })
        ? faker.date.between({ from: createdDate, to: new Date() })
        : null;
      const updated_at = updatedDate ? updatedDate.toISOString() : null;
      const last_touched = updated_at || created_at;

      const lineItemCount = faker.number.int({ min: 2, max: 8 });
      const lineItems = Array.from({ length: lineItemCount }).map((_, idx) => ({
        id: faker.string.uuid(),
        title: faker.music.songName(),
        display: faker.lorem.sentence(),
        sort_order: idx,
        created_at,
        updated_at: null,
      }));
      const disabled_at = faker.datatype.boolean({ probability: 0.2 })
        ? new Date().toISOString()
        : null;
      return {
        id: faker.string.uuid(),
        unique_name: faker.string.alphanumeric(10),
        display: `Practice ${faker.music.genre()}`,
        default_recommended_time_minutes: faker.number.int({
          min: 15,
          max: 60,
        }),
        line_items: lineItems,
        disabled_at,
        created_at,
        updated_at,
        last_touched,
      };
    });
  }

  async list(
    pagArgs: PagArgs,
    params?: PracticeSessionSearchParams
  ): Promise<Pagination<PracticeSessionTemplate>> {
    await DevSettings.wait();

    let filtered = [...this.sessions];

    // Filter by disabled state (unless showDisabled is true)
    if (!params?.showDisabled) {
      filtered = filtered.filter((s) => s.disabled_at === null);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.display.toLowerCase().includes(search) ||
          s.unique_name.toLowerCase().includes(search)
      );
    }

    if (params?.sortId) {
      const { sortId, sortDir } = params;
      filtered.sort((a, b) => {
        const aVal = a[sortId as keyof PracticeSessionTemplate];
        const bVal = b[sortId as keyof PracticeSessionTemplate];

        if (
          aVal === undefined ||
          aVal === null ||
          bVal === undefined ||
          bVal === null
        ) {
          return 0;
        }

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

  async get(id: string): Promise<PracticeSessionTemplate> {
    await DevSettings.wait();
    const session = this.sessions.find((s) => s.id === id);
    if (!session) {
      throw new Error('Practice session not found');
    }
    return JSON.parse(JSON.stringify(session)); // Return copy
  }

  async create(
    data: Omit<
      PracticeSessionTemplate,
      'id' | 'created_at' | 'updated_at' | 'last_touched'
    >
  ): Promise<PracticeSessionTemplate> {
    await DevSettings.wait();
    const now = new Date().toISOString();
    const newSession: PracticeSessionTemplate = {
      ...data,
      id: faker.string.uuid(),
      created_at: now,
      updated_at: null,
      last_touched: now,
    };
    this.sessions.unshift(newSession);
    return newSession;
  }

  async update(
    id: string,
    data: Partial<
      Omit<
        PracticeSessionTemplate,
        'id' | 'created_at' | 'updated_at' | 'last_touched'
      >
    >
  ): Promise<PracticeSessionTemplate> {
    // For auto-save, we might not want to wait too long, but let's keep it consistent for now.
    // In a real app, we might debounce this.
    await DevSettings.wait();

    const index = this.sessions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Practice session not found');
    }

    const now = new Date().toISOString();
    this.sessions[index] = {
      ...this.sessions[index],
      ...data,
      updated_at: now,
      last_touched: now,
    };
    return this.sessions[index];
  }

  async delete(id: string): Promise<{ success: boolean; reason?: string }> {
    await DevSettings.wait();
    const index = this.sessions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('Practice session not found');
    }

    this.sessions.splice(index, 1);
    return { success: true };
  }
}

export const mockPracticeSessionStore = new MockPracticeSessionStore();
