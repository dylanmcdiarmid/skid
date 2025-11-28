import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  mockDayInstanceStore,
  type DayInstance,
} from '@/api/day-instances';
import type { SortState } from '@/components/data-table/types';
import { usePaginatedFetcher } from '@/hooks/use-paginated-fetcher';
import type { Pagination as PaginationType } from '@/lib/utils';
import { DayInstanceTable } from './table';

interface DayInstanceSmartTableProps {
  // Callbacks
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;

  // Focused ID (controlled or uncontrolled)
  focusedId?: string | null;
  onFocusedIdChange?: (id: string | null) => void;

  className?: string;
}

const instanceFetcher = (
  pagArgs: { page: number; pageSize: number },
  params?: { search?: string; sort?: SortState }
) => {
  return {
    abort: () => true,
    response: async (): Promise<PaginationType<DayInstance>> => {
      return mockDayInstanceStore.list(pagArgs, {
        search: params?.search,
        sortId: params?.sort?.columnId || undefined,
        sortDir: params?.sort?.direction || undefined,
      });
    },
  };
};

export function DayInstanceSmartTable(
  props: DayInstanceSmartTableProps
) {
  const {
    onEdit,
    onDelete,
    className,
  } = props;

  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as any;

  const [internalFocusedId, setInternalFocusedId] = useState<string | null>(
    null
  );
  const focusedId =
    props.focusedId !== undefined ? props.focusedId : internalFocusedId;
  const handleFocusedIdChange = (id: string | null) => {
    if (props.onFocusedIdChange) {
      props.onFocusedIdChange(id);
    }
    setInternalFocusedId(id);
  };

  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const search = (searchParams.search as string) || '';
  const sortState: SortState = useMemo(() => {
    return {
      columnId: (searchParams.sortId as string) || 'id', // Default to date/id
      direction: (searchParams.sortDir as 'asc' | 'desc') || 'desc',
    };
  }, [searchParams.sortId, searchParams.sortDir]);

  const { loadPage, state } = usePaginatedFetcher<
    DayInstance,
    { search: string; sort: SortState }
  >({
    fetcher: instanceFetcher,
    cacheKey: 'day-instances',
  });

  const paginationData = useAtomValue(state.data);
  const isLoading = useAtomValue(state.isLoading);

  const refreshData = useCallback(() => {
    loadPage(
      { page, pageSize },
      {
        search,
        sort: sortState,
      }
    );
  }, [loadPage, page, pageSize, search, sortState]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    navigate({
      search: { ...searchParams, search: newSearch, page: 1 },
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({
      search: { ...searchParams, page: newPage },
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

  return (
    <DayInstanceTable
      className={className}
      data={paginationData.items}
      focusedId={focusedId}
      isLoading={!!isLoading}
      onDelete={onDelete}
      onEdit={onEdit}
      onFocusedIdChange={handleFocusedIdChange}
      onSearchChange={handleSearchChange}
      onSortChange={handleSortChange}
      pagination={{
        currentPage: paginationData.currentPage || 1,
        pageSize: paginationData.pageSize || 10,
        totalItems: paginationData.totalItems || 0,
        totalPages: paginationData.totalPages || 1,
        onPageChange: handlePageChange,
      }}
      search={search}
      sortState={sortState}
    />
  );
}

