import { format, formatDistanceToNow } from 'date-fns';
import { PencilIcon, TrashIcon } from 'lucide-react';
import type { DayInstance } from '@/api/day-instances';
import {
  type ActiveFilter,
  ActiveFiltersList,
} from '@/components/data-table/active-filters-list';
import { DataTable } from '@/components/data-table/data-table';
import { Pagination } from '@/components/data-table/pagination';
import { SearchInput } from '@/components/data-table/search-input';
import type { ColumnDef, SortState } from '@/components/data-table/types';
import { Button } from '@/components/ui/button';
import humanizeDuration from 'humanize-duration';

interface DayInstanceTableProps {
  data: DayInstance[];
  isLoading: boolean;

  // Search & Filter
  search: string;
  onSearchChange: (value: string) => void;

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
  
  // Actions
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;

  className?: string;
}

export function DayInstanceTable({
  data,
  isLoading,
  search,
  onSearchChange,
  sortState,
  onSortChange,
  pagination,
  focusedId,
  onFocusedIdChange,
  onEdit,
  onDelete,
  className,
}: DayInstanceTableProps) {
  const columns: ColumnDef<DayInstance>[] = [
    {
      header: 'Date',
      accessorKey: 'id', // The ID is the date YYYY-MM-DD
      enableSorting: true,
      cell: (item) => <span className="font-medium">{item.id}</span>,
    },
    {
      header: 'Last Touched',
      accessorKey: 'last_touched', // This is a virtual key for sorting, mapped in API
      enableSorting: true,
      cell: (item) => {
        const date = item.updated_at || item.created_at;
        return (
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(date), {
              addSuffix: true,
            })}
          </span>
        );
      },
    },
    {
      header: 'Total Time',
      accessorKey: 'actual_time_total',
      enableSorting: true,
      cell: (item) => (
        <span className="text-muted-foreground text-sm">
          {item.actual_time_total > 0
            ? humanizeDuration(item.actual_time_total * 60000, {
                round: true,
                largest: 1,
              })
            : '-'}
        </span>
      ),
    },
    // Actions column
    {
      header: '',
      accessorKey: 'actions',
      className: 'w-[100px]',
      cell: (item: DayInstance) => (
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
          </div>
        </div>
        <ActiveFiltersList filters={activeFilters} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <DataTable
          className="border-none"
          columns={columns}
          data={data}
          expandedRowRender={(item) => (
             <div className="bg-muted/50 p-4 text-sm space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-2">
                   <div><span className="font-medium">Sessions:</span> {item.sessions.length}</div>
                   <div><span className="font-medium">Last Touched:</span> {format(new Date(item.updated_at || item.created_at), 'PPpp')}</div>
                </div>
                {item.notes && (
                    <div className="mb-4">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Notes</h4>
                        <p className="text-muted-foreground italic">{item.notes}</p>
                    </div>
                )}
                {item.sessions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Practice Sessions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {item.sessions.map((session) => (
                        <div key={session.id} className="border rounded-md p-3 bg-background shadow-sm">
                            <div className="flex justify-between items-baseline mb-2 border-b pb-1">
                              <span className="font-medium truncate" title={session.display}>
                                {session.display}
                              </span>
                              <span className="text-muted-foreground text-xs shrink-0 ml-2">
                                {session.actual_time_spent_minutes > 0 
                                    ? humanizeDuration(session.actual_time_spent_minutes * 60000, { round: true, largest: 1 })
                                    : (session.recommended_time_minutes ? `${session.recommended_time_minutes}m rec` : '')
                                }
                              </span>
                            </div>
                            {session.line_items && session.line_items.length > 0 ? (
                              <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5 ml-1">
                                  {session.line_items.slice(0, 5).map(li => (
                                    <li key={li.id} className="truncate" title={li.display || li.title || ''}>
                                        {li.title ? <span className="font-semibold">{li.title}: </span> : null}
                                        {li.display}
                                    </li>
                                  ))}
                                  {session.line_items.length > 5 && (
                                    <li className="list-none pt-1 text-[10px] italic">
                                      + {session.line_items.length - 5} more...
                                    </li>
                                  )}
                              </ul>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">No line items</span>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          )}
          focusedId={focusedId}
          isLoading={isLoading}
          onFocusedIdChange={onFocusedIdChange}
          onSortChange={onSortChange}
          onRowDoubleClick={onEdit ? (item) => onEdit(item.id) : undefined}
          rowKey="id"
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

