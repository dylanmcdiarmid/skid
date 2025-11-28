import { useNavigate, useSearch } from '@tanstack/react-router';
import { format, formatDistanceToNow } from 'date-fns';
import { useAtomValue } from 'jotai';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { type PracticeSessionTemplate, mockPracticeSessionStore } from '@/api/practice-sessions';
import { ActiveFiltersList, type ActiveFilter } from '@/components/data-table/active-filters-list';
import { DataTable } from '@/components/data-table/data-table';
import { Pagination } from '@/components/data-table/pagination';
import { SearchInput } from '@/components/data-table/search-input';
import type { ColumnDef, SortState } from '@/components/data-table/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { usePaginatedFetcher } from '@/hooks/use-paginated-fetcher';
import type { Pagination as PaginationType } from '@/lib/utils';

interface PracticeSessionListProps {
  focusedId: string | null;
  onFocusedIdChange: (id: string | null) => void;
}

const sessionFetcher = (
  pagArgs: { page: number; pageSize: number },
  params?: { search?: string; sort?: SortState; showDisabled?: boolean }
) => {
  return {
    abort: () => true,
    response: async (): Promise<PaginationType<PracticeSessionTemplate>> => {
      return mockPracticeSessionStore.list(pagArgs, {
        search: params?.search,
        sortId: params?.sort?.columnId || undefined,
        sortDir: params?.sort?.direction || undefined,
        showDisabled: params?.showDisabled,
      });
    },
  };
};

export function PracticeSessionList({
  focusedId,
  onFocusedIdChange,
}: PracticeSessionListProps) {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as any;

  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const search = (searchParams.search as string) || '';
  const showDisabled = searchParams.showDisabled === 'true';
  const sortState: SortState = {
    columnId: (searchParams.sortId as string) || 'last_touched',
    direction: (searchParams.sortDir as 'asc' | 'desc') || 'desc',
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const { loadPage, state } = usePaginatedFetcher<
    PracticeSessionTemplate,
    { search: string; sort: SortState; showDisabled: boolean }
  >({
    fetcher: sessionFetcher,
    cacheKey: 'practice-sessions',
  });

  const paginationData = useAtomValue(state.data);
  const isLoading = useAtomValue(state.isLoading);

  const refreshData = useCallback(() => {
    loadPage(
      { page, pageSize },
      {
        search,
        sort: {
          columnId: searchParams.sortId || null,
          direction: searchParams.sortDir || null,
        },
        showDisabled,
      },
      true
    );
  }, [
    loadPage,
    page,
    pageSize,
    search,
    searchParams.sortId,
    searchParams.sortDir,
    showDisabled,
  ]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSearchChange = (newSearch: string) => {
    navigate({
      search: {
        ...searchParams,
        search: newSearch,
        page: 1,
      },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      search: {
        ...searchParams,
        page: newPage,
      },
    });
  };

  const handleSortChange = (newSort: SortState) => {
    navigate({
      search: {
        ...searchParams,
        sortId: newSort.columnId,
        sortDir: newSort.direction,
      },
    });
  };

  const handleShowDisabledChange = (checked: boolean) => {
    navigate({
      search: {
        ...searchParams,
        showDisabled: checked ? 'true' : undefined,
        page: 1,
      },
    });
  };

  const handleCreate = () => {
    navigate({ to: '/templates/sessions/new' });
  };

  const handleEdit = (id: string) => {
    navigate({ to: '/templates/sessions/$sessionId', params: { sessionId: id } });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await mockPracticeSessionStore.delete(deleteId);
      if (result.success) {
        toast.success('Practice session deleted');
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(deleteId);
          return next;
        });
      } else {
        toast.error('Failed to delete practice session');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

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
        <span className="font-mono text-sm text-muted-foreground">
          {item.unique_name}
        </span>
      ),
    },
    {
      header: 'Last Touched',
      accessorKey: 'last_touched',
      enableSorting: true,
      cell: (item) => (
        <span className="text-sm text-muted-foreground">
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
    {
      header: '',
      accessorKey: 'actions',
      className: 'w-[100px]',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item.id);
            }}
            size="icon"
            variant="ghost"
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            className="h-8 w-8 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(item.id);
            }}
            size="icon"
            variant="ghost"
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const handleKeyBindings = {
    e: (item: PracticeSessionTemplate) => handleEdit(item.id),
    Delete: (item: PracticeSessionTemplate) => handleDeleteClick(item.id),
    Backspace: (item: PracticeSessionTemplate) => handleDeleteClick(item.id),
  };

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
     ...(showDisabled
      ? [
          {
            id: 'disabled',
            label: 'Status',
            value: 'Showing Disabled',
            onRemove: () => handleShowDisabledChange(false),
            colorClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800',
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center space-x-4">
                <SearchInput
                    className="w-[300px]"
                    onChange={handleSearchChange}
                    value={search}
                />
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id="show-disabled" 
                        checked={showDisabled}
                        onCheckedChange={handleShowDisabledChange}
                    />
                    <Label htmlFor="show-disabled">Show Disabled</Label>
                </div>
            </div>
            <Button onClick={handleCreate}>New Session</Button>
        </div>
        <ActiveFiltersList filters={activeFilters} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <DataTable
          className="border-none"
          columns={columns}
          data={paginationData.items.filter((item) => !deletedIds.has(item.id))}
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
          isLoading={!!isLoading}
          onFocusedIdChange={onFocusedIdChange}
          onKeyBindings={handleKeyBindings}
          onSortChange={handleSortChange}
          rowKey="id"
          sortState={sortState}
        />
      </div>

      <Pagination
        currentPage={paginationData.currentPage || 1}
        isLoading={!!isLoading}
        onPageChange={handlePageChange}
        pageSize={paginationData.pageSize || 10}
        totalItems={paginationData.totalItems || 0}
        totalPages={paginationData.totalPages || 1}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setDeleteId(null)}
        open={!!deleteId}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              practice session template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={confirmDelete}
            >
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
