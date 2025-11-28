/** biome-ignore-all lint/style/noNestedTernary: not fixing now */

import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import {
  ActiveFiltersList,
  type ActiveFilter,
} from '@/components/data-table/active-filters-list';
import { DataTable } from '@/components/data-table/data-table';
import { FacetedFilter } from '@/components/data-table/faceted-filter';
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
import { DevSettings } from '@/lib/dev-settings';
import type { Pagination as PaginationType } from '@/lib/utils';

// Search Params Validator
export type DemoTableSearchParams = {
  page: number;
  pageSize: number;
  search: string;
  sortId: string | undefined;
  sortDir: 'asc' | 'desc' | undefined;
  roles: string[] | undefined;
  statuses: string[] | undefined;
};

const parseArrayParam = (param: unknown): string[] | undefined => {
  if (Array.isArray(param)) {
    return param.map(String);
  }
  if (typeof param === 'string') {
    return [param];
  }
  return undefined;
};

export const demoTableSearchValidator = (
  search: Record<string, unknown>
): DemoTableSearchParams => {
  return {
    page: Number(search.page) || 1,
    pageSize: Number(search.pageSize) || 10,
    search: (search.search as string) || '',
    sortId: (search.sortId as string) || undefined,
    sortDir: (search.sortDir as 'asc' | 'desc') || undefined,
    roles: parseArrayParam(search.roles),
    statuses: parseArrayParam(search.statuses),
  };
};

// Mock Data Type
interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
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
    isVerified: Math.random() > 0.5,
    lastLogin: new Date(
      Date.now() - Math.floor(Math.random() * 10_000_000_000)
    ).toISOString(),
  }));
};

const allUsers = generateMockData(100);

// Mock Fetcher
const mockUserFetcher = (
  pagArgs: { page: number; pageSize: number },
  params?: {
    search?: string;
    sort?: SortState;
    roles?: string[];
    statuses?: string[];
  }
) => {
  return {
    abort: () => true,
    response: async (): Promise<PaginationType<User>> => {
      // Simulate network delay
      await DevSettings.wait();

      let filtered = [...allUsers];

      // Filter by Search
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.role.toLowerCase().includes(search)
        );
      }

      // Filter by Roles
      if (params?.roles && params.roles.length > 0) {
        filtered = filtered.filter((u) => params.roles?.includes(u.role));
      }

      // Filter by Statuses
      if (params?.statuses && params.statuses.length > 0) {
        filtered = filtered.filter((u) => params.statuses?.includes(u.status));
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
  const navigate = useNavigate();
  // We can use strict: false if the route isn't fully typed yet,
  // or ideally we rely on the router context.
  // For now, since we are modifying the route definition in parallel,
  // we will cast or trust the validator handles it if we passed it to createRoute.
  const searchParams = useSearch({
    strict: false, // We'll enable strict once we connect the type in app.tsx if possible, or just rely on runtime validation
  }) as DemoTableSearchParams;

  const page = searchParams.page || 1;
  const pageSize = searchParams.pageSize || 10;
  const search = searchParams.search || '';
  const sortState: SortState = {
    columnId: searchParams.sortId || null,
    direction: searchParams.sortDir || null,
  };
  const selectedRoles = new Set(searchParams.roles || []);
  const selectedStatuses = new Set(searchParams.statuses || []);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { loadPage, state } = usePaginatedFetcher<
    User,
    {
      search: string;
      sort: SortState;
      roles: string[];
      statuses: string[];
    }
  >({
    fetcher: mockUserFetcher,
    cacheKey: 'demo-users',
  });

  const paginationData = useAtomValue(state.data);
  const isLoading = useAtomValue(state.isLoading);

  // Initial load and reload on search/sort change
  useEffect(() => {
    loadPage(
      { page, pageSize },
      {
        search,
        sort: {
          columnId: searchParams.sortId || null,
          direction: searchParams.sortDir || null,
        },
        roles: Array.from(selectedRoles),
        statuses: Array.from(selectedStatuses),
      }
    );
  }, [
    loadPage,
    search,
    searchParams.sortId,
    searchParams.sortDir,
    page,
    pageSize,
    // We need to include array dependencies carefully or use JSON.stringify
    // But here we are using searchParams which are objects from the router,
    // assuming they are stable or we can depend on the values.
    // Using JSON.stringify for array comparisons in dependency array is a common trick.
    JSON.stringify(searchParams.roles),
    JSON.stringify(searchParams.statuses),
  ]);

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        ...searchParams,
        page: newPage,
      } as any,
    });
  };

  const handleSortChange = (newSort: SortState) => {
    navigate({
      search: {
        ...searchParams,
        sortId: newSort.columnId,
        sortDir: newSort.direction,
      } as any,
    });
  };

  const handleSearchChange = (newSearch: string) => {
    navigate({
      search: {
        ...searchParams,
        search: newSearch,
        page: 1, // Reset to page 1 on search
      } as any,
    });
  };

  const handleRoleSelect = (value: string) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(value)) {
      newRoles.delete(value);
    } else {
      newRoles.add(value);
    }
    navigate({
      search: {
        ...searchParams,
        roles: Array.from(newRoles),
        page: 1,
      } as any,
    });
  };

  const handleStatusSelect = (value: string) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(value)) {
      newStatuses.delete(value);
    } else {
      newStatuses.add(value);
    }
    navigate({
      search: {
        ...searchParams,
        statuses: Array.from(newStatuses),
        page: 1,
      } as any,
    });
  };

  const handleClearRoles = () => {
    navigate({
      search: {
        ...searchParams,
        roles: undefined,
        page: 1,
      } as any,
    });
  };

  const handleClearStatuses = () => {
    navigate({
      search: {
        ...searchParams,
        statuses: undefined,
        page: 1,
      } as any,
    });
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
      header: 'Verified',
      accessorKey: 'isVerified',
      cell: (user) => (user.isVerified ? 'Yes' : 'No'),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      enableSorting: true,
      cell: (user) => new Date(user.lastLogin).toLocaleDateString(),
    },
  ];

  const activeFilters: ActiveFilter[] = [
    ...(search
      ? [
          {
            id: 'search',
            label: 'Search',
            value: search,
            onRemove: () => handleSearchChange(''),
            colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800',
          },
        ]
      : []),
    ...Array.from(selectedRoles).map((role) => ({
      id: `role-${role}`,
      label: 'Role',
      value: role,
      onRemove: () => handleRoleSelect(role),
    })),
    ...Array.from(selectedStatuses).map((status) => ({
      id: `status-${status}`,
      label: 'Status',
      value: status,
      onRemove: () => handleStatusSelect(status),
    })),
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 items-center space-x-2">
                <SearchInput
                  className="w-[250px]"
                  onChange={handleSearchChange}
                  placeholder="Search users..."
                  value={search}
                />
                <FacetedFilter
                  title="Role"
                  options={[
                    { label: 'Admin', value: 'Admin' },
                    { label: 'User', value: 'User' },
                    { label: 'Editor', value: 'Editor' },
                  ]}
                  selectedValues={selectedRoles}
                  onSelect={handleRoleSelect}
                  onClear={handleClearRoles}
                />
                <FacetedFilter
                  title="Status"
                  options={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                    { label: 'Pending', value: 'pending' },
                  ]}
                  selectedValues={selectedStatuses}
                  onSelect={handleStatusSelect}
                  onClear={handleClearStatuses}
                />
              </div>
              <div className="text-muted-foreground text-sm">
                {selectedIds.length} selected
              </div>
            </div>
            <ActiveFiltersList filters={activeFilters} />
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
              onSortChange={handleSortChange}
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
