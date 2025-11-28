import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { type Generator, mockGeneratorStore } from '@/api/generators';
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
import { Spinner } from '@/components/ui/spinner';
import { usePaginatedFetcher } from '@/hooks/use-paginated-fetcher';
import type { Pagination as PaginationType } from '@/lib/utils';

interface GeneratorListProps {
  onEdit: (id: string) => void;
  onCreate: () => void;
  focusedId: string | null;
  onFocusedIdChange: (id: string | null) => void;
}

const generatorFetcher = (
  pagArgs: { page: number; pageSize: number },
  params?: { search?: string; sort?: SortState }
) => {
  return {
    abort: () => true, // Not implemented for mock
    response: async (): Promise<PaginationType<Generator>> => {
      return mockGeneratorStore.list(pagArgs, {
        search: params?.search,
        sortId: params?.sort?.columnId || undefined,
        sortDir: params?.sort?.direction || undefined,
      });
    },
  };
};

export function GeneratorList({
  onEdit,
  onCreate,
  focusedId,
  onFocusedIdChange,
}: GeneratorListProps) {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as any;

  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const search = (searchParams.search as string) || '';
  const sortState: SortState = {
    columnId: (searchParams.sortId as string) || null,
    direction: (searchParams.sortDir as 'asc' | 'desc') || null,
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const { loadPage, state } = usePaginatedFetcher<
    Generator,
    { search: string; sort: SortState }
  >({
    fetcher: generatorFetcher,
    cacheKey: 'generators',
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
      },
      true // Force clear cache
    );
  }, [
    loadPage,
    page,
    pageSize,
    search,
    searchParams.sortId,
    searchParams.sortDir,
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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await mockGeneratorStore.delete(deleteId);
      if (result.success) {
        toast.success('Generator deleted');
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(deleteId);
          return next;
        });
        // refreshData();
      } else if (result.reason === 'in_use') {
        toast.error('Cannot delete: generator is in use by existing sessions');
      } else {
        toast.error('Failed to delete generator');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const columns: ColumnDef<Generator>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      enableSorting: true,
      cell: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      header: 'Strategy',
      accessorKey: 'strategy',
      enableSorting: true,
      cell: (item) => (
        <span className="capitalize">{item.strategy.replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Data Source',
      accessorKey: 'data_source',
      cell: (item) => (
        <span className="block max-w-[300px] truncate text-muted-foreground">
          {item.data_source}
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
              onEdit(item.id);
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
    e: (item: Generator) => onEdit(item.id),
    // biome-ignore lint/correctness/noNestedComponentDefinitions: not a component
    Delete: (item: Generator) => handleDeleteClick(item.id),
    // biome-ignore lint/correctness/noNestedComponentDefinitions: not a component
    Backspace: (item: Generator) => handleDeleteClick(item.id),
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <SearchInput
          className="w-[300px]"
          onChange={handleSearchChange}
          value={search}
        />
        <Button onClick={onCreate}>New Generator</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        <DataTable
          className="border-none"
          columns={columns}
          data={paginationData.items.filter((item) => !deletedIds.has(item.id))}
          expandedRowRender={(item) => (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Data Source</h4>
              <div className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-muted-foreground text-sm">
                {item.data_source || 'No data source provided'}
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
              generator.
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
