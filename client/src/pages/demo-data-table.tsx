/** biome-ignore-all lint/style/noNestedTernary: not fixing now */
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import { DataTable } from '@/components/data-table/data-table';
import { Pagination } from '@/components/data-table/pagination';
import { SearchInput } from '@/components/data-table/search-input';
import type { ColumnDef, SortState } from '@/components/data-table/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePaginatedFetcher } from '@/hooks/use-paginated-fetcher';
import type { Pagination as PaginationType } from '@/lib/utils';

// Mock Data Type
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

// Mock Data Generator
const generateMockData = (count: number): User[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`,
    role: ['Admin', 'User', 'Editor'][Math.floor(Math.random() * 3)],
    email: `user${i + 1}@example.com`,
    status: ['active', 'inactive', 'pending'][
      Math.floor(Math.random() * 3)
    ] as User['status'],
    lastLogin: new Date(
      Date.now() - Math.floor(Math.random() * 10_000_000_000)
    ).toISOString(),
  }));
};

const allUsers = generateMockData(100);

// Mock Fetcher
const mockUserFetcher = (
  pagArgs: { page: number; pageSize: number },
  params?: { search?: string; sort?: SortState }
) => {
  return {
    abort: () => true,
    response: async (): Promise<PaginationType<User>> => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      let filtered = [...allUsers];

      // Filter
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.role.toLowerCase().includes(search)
        );
      }

      // Sort
      if (params?.sort?.columnId) {
        const { columnId, direction } = params.sort;
        filtered.sort((a, b) => {
          const aVal = a[columnId as keyof User];
          const bVal = b[columnId as keyof User];
          if (aVal < bVal) {
            return direction === 'asc' ? -1 : 1;
          }
          if (aVal > bVal) {
            return direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      // Paginate
      const start = (pagArgs.page - 1) * pagArgs.pageSize;
      const end = start + pagArgs.pageSize;
      const pageItems = filtered.slice(start, end);

      return {
        items: pageItems,
        totalItems: filtered.length,
        pageSize: pagArgs.pageSize,
        currentPage: pagArgs.page,
        totalPages: Math.ceil(filtered.length / pagArgs.pageSize),
      };
    },
  };
};

export default function DemoDataTable() {
  const [sortState, setSortState] = useState<SortState>({
    columnId: 'name',
    direction: 'asc',
  });
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { loadPage, state } = usePaginatedFetcher<
    User,
    { search: string; sort: SortState }
  >({
    fetcher: mockUserFetcher,
    cacheKey: 'demo-users',
  });

  const paginationData = useAtomValue(state.data);
  const isLoading = useAtomValue(state.isLoading);

  // Initial load and reload on search/sort change
  useEffect(() => {
    loadPage({ page: 1, pageSize: 10 }, { search, sort: sortState });
  }, [loadPage, search, sortState]);

  const handlePageChange = (page: number) => {
    loadPage({ page, pageSize: 10 }, { search, sort: sortState });
  };

  const columns: ColumnDef<User>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      enableSorting: true,
    },
    {
      header: 'Role',
      accessorKey: 'role',
      enableSorting: true,
    },
    {
      header: 'Email',
      accessorKey: 'email',
      enableSorting: true,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (user) => (
        <span
          className={`rounded px-2 py-1 font-medium text-xs ${
            user.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : user.status === 'inactive'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
          }`}
        >
          {user.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      enableSorting: true,
      cell: (user) => new Date(user.lastLogin).toLocaleDateString(),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">Data Table Demo</h1>
        <p className="text-muted-foreground">
          A lightweight data table with server-side pagination, sorting,
          filtering, and selection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage system users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <SearchInput
              className="w-[300px]"
              onChange={setSearch}
              placeholder="Search users..."
              value={search}
            />
            <div className="text-muted-foreground text-sm">
              {selectedIds.length} selected
            </div>
          </div>

          {/* Table */}
          <div className="h-[500px] overflow-hidden rounded-md border">
            <DataTable
              columns={columns}
              data={paginationData.items}
              expandedRowRender={(user) => (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User ID:</span> {user.id}
                  </div>
                  <div>
                    <span className="font-medium">Details:</span> Extended
                    details for {user.name} would go here.
                  </div>
                </div>
              )}
              expandOnClick={false}
              focusOnClick={true}
              isLoading={!!isLoading}
              onSelectionChange={setSelectedIds}
              onSortChange={setSortState}
              selectedIds={selectedIds} // Use chevron
              selectOnClick={false} // Use checkbox
              sortState={sortState}
            />
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={paginationData.currentPage || 1} // Handle initial 0 state
            isLoading={!!isLoading}
            onPageChange={handlePageChange}
            pageSize={paginationData.pageSize || 10}
            totalItems={paginationData.totalItems || 0}
            totalPages={paginationData.totalPages || 1}
          />
        </CardContent>
      </Card>
    </div>
  );
}
