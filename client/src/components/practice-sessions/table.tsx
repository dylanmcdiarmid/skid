import { format, formatDistanceToNow } from 'date-fns';
import { PencilIcon, TrashIcon } from 'lucide-react';
import type { PracticeSessionTemplate } from '@/api/practice-sessions';
import {
  type ActiveFilter,
  ActiveFiltersList,
} from '@/components/data-table/active-filters-list';
import { DataTable } from '@/components/data-table/data-table';
import { Pagination } from '@/components/data-table/pagination';
import { SearchInput } from '@/components/data-table/search-input';
import type { ColumnDef, SortState } from '@/components/data-table/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PracticeSessionTableProps {
  data: PracticeSessionTemplate[];
  isLoading: boolean;

  // Search & Filter
  search: string;
  onSearchChange: (value: string) => void;
  showDisabled: boolean;
  onShowDisabledChange: (value: boolean) => void;

  // Sorting
  sortState: SortState;
  onSortChange: (state: SortState) => void;

  // Pagination
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };

  // Selection / Focus
  focusedId: string | null;
  onFocusedIdChange: (id: string | null) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // Actions
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;

  className?: string;
}

export function PracticeSessionTable({
  data,
  isLoading,
  search,
  onSearchChange,
  showDisabled,
  onShowDisabledChange,
  sortState,
  onSortChange,
  pagination,
  focusedId,
  onFocusedIdChange,
  selectedIds,
  onSelectionChange,
  onCreate,
  onEdit,
  onDelete,
  className,
}: PracticeSessionTableProps) {
  const columns: ColumnDef<PracticeSessionTemplate>[] = [
    {
      header: 'Display Name',
      accessorKey: 'display',
      enableSorting: true,
      cell: (item) => <span className="font-medium">{item.display}</span>,
    },
    {
      header: 'Unique Name',
      accessorKey: 'unique_name',
      enableSorting: true,
      cell: (item) => (
        <span className="font-mono text-muted-foreground text-sm">
          {item.unique_name}
        </span>
      ),
    },
    {
      header: 'Last Touched',
      accessorKey: 'last_touched',
      enableSorting: true,
      cell: (item) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(item.last_touched), {
            addSuffix: true,
          })}
        </span>
      ),
    },
    {
      header: 'Is Disabled?',
      accessorKey: 'disabled_at',
      enableSorting: true,
      cell: (item) => (
        <span
          className={`rounded px-2 py-1 font-medium text-xs ${
            item.disabled_at
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          }`}
        >
          {item.disabled_at ? 'Disabled' : 'Active'}
        </span>
      ),
    },
    // Only show actions column if handlers are provided
    ...(onEdit || onDelete
      ? [
          {
            header: '',
            accessorKey: 'actions',
            className: 'w-[100px]',
            cell: (item: PracticeSessionTemplate) => (
              <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                {onEdit && (
                  <Button
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item.id);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    className="h-8 w-8 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const activeFilters: ActiveFilter[] = [
    ...(search
      ? [
          {
            id: 'search',
            label: 'Search',
            value: search,
            onRemove: () => onSearchChange(''),
            colorClass:
              'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800',
          },
        ]
      : []),
    ...(showDisabled
      ? [
          {
            id: 'disabled',
            label: 'Status',
            value: 'Showing Disabled',
            onRemove: () => onShowDisabledChange(false),
            colorClass:
              'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800',
          },
        ]
      : []),
  ];

  return (
    <div className={`flex h-full flex-col space-y-4 ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center space-x-4">
            <SearchInput
              className="w-[300px]"
              onChange={onSearchChange}
              value={search}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={showDisabled}
                id="show-disabled"
                onCheckedChange={onShowDisabledChange}
              />
              <Label htmlFor="show-disabled">Show Disabled</Label>
            </div>
          </div>
          {onCreate && <Button onClick={onCreate}>New Session</Button>}
        </div>
        <ActiveFiltersList filters={activeFilters} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <DataTable
          className="border-none"
          columns={columns}
          data={data}
          expandedRowRender={(item) => (
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 text-sm">
              <div>
                <span className="font-medium">Duration:</span>{' '}
                {item.default_recommended_time_minutes} minutes
              </div>
              <div>
                <span className="font-medium">Line Items:</span>{' '}
                {item.line_items.length} items
              </div>
              <div className="col-span-2">
                <span className="font-medium">Last Touched:</span>{' '}
                {format(new Date(item.last_touched), 'PPpp')}
              </div>
            </div>
          )}
          focusedId={focusedId}
          isLoading={isLoading}
          onFocusedIdChange={onFocusedIdChange}
          onSelectionChange={onSelectionChange}
          onSortChange={onSortChange}
          rowKey="id"
          selectedIds={selectedIds}
          selectOnClick={!!onSelectionChange}
          // Enable click selection if onSelectionChange is provided
          sortState={sortState}
        />
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        isLoading={isLoading}
        onPageChange={pagination.onPageChange}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
