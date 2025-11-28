import { useNavigate, useSearch } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  mockPracticeSessionStore,
  type PracticeSessionTemplate,
} from '@/api/practice-sessions';
import type { SortState } from '@/components/data-table/types';
import { usePaginatedFetcher } from '@/hooks/use-paginated-fetcher';
import type { Pagination as PaginationType } from '@/lib/utils';
import { PracticeSessionTable } from './table';

type TableMode = 'url' | 'local';

interface PracticeSessionSmartTableProps {
  mode: TableMode;

  // For selection mode
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  // Callbacks
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;

  // Focused ID (controlled or uncontrolled)
  focusedId?: string | null;
  onFocusedIdChange?: (id: string | null) => void;

  className?: string;
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

export function PracticeSessionSmartTable(
  props: PracticeSessionSmartTableProps
) {
  const {
    mode,
    selectedIds,
    onSelectionChange,
    onEdit,
    onDelete,
    onCreate,
    className,
  } = props;

  const navigate = useNavigate();
  // We only use useSearch if mode is 'url'.
  // However, hooks must be called unconditionally.
  // We'll handle this by checking mode before using the values.
  const searchParams = useSearch({ strict: false }) as any;

  // Local state for 'local' mode
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, _setLocalPageSize] = useState(10);
  const [localSearch, setLocalSearch] = useState('');
  const [localShowDisabled, setLocalShowDisabled] = useState(false);
  const [localSortState, setLocalSortState] = useState<SortState>({
    columnId: 'last_touched',
    direction: 'desc',
  });

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

  // Derived state based on mode
  const page = mode === 'url' ? Number(searchParams.page) || 1 : localPage;
  const pageSize =
    mode === 'url' ? Number(searchParams.pageSize) || 10 : localPageSize;
  const search =
    mode === 'url' ? (searchParams.search as string) || '' : localSearch;
  const showDisabled =
    mode === 'url' ? searchParams.showDisabled === 'true' : localShowDisabled;
  const sortState: SortState = useMemo(() => {
    if (mode === 'url') {
      return {
        columnId: (searchParams.sortId as string) || 'last_touched',
        direction: (searchParams.sortDir as 'asc' | 'desc') || 'desc',
      };
    }
    return localSortState;
  }, [mode, searchParams.sortId, searchParams.sortDir, localSortState]);

  const { loadPage, state } = usePaginatedFetcher<
    PracticeSessionTemplate,
    { search: string; sort: SortState; showDisabled: boolean }
  >({
    fetcher: sessionFetcher,
    cacheKey: `practice-sessions-${mode}`, // distinct cache keys
  });

  const paginationData = useAtomValue(state.data);
  const isLoading = useAtomValue(state.isLoading);

  const refreshData = useCallback(() => {
    loadPage(
      { page, pageSize },
      {
        search,
        sort: sortState,
        showDisabled,
      },
      // force refresh if local to ensure we get fresh data when mounting in modal
      mode === 'local'
    );
  }, [loadPage, page, pageSize, search, sortState, showDisabled, mode]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handlers
  const handleSearchChange = (newSearch: string) => {
    if (mode === 'url') {
      navigate({
        search: { ...searchParams, search: newSearch, page: 1 },
      });
    } else {
      setLocalSearch(newSearch);
      setLocalPage(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (mode === 'url') {
      navigate({
        search: { ...searchParams, page: newPage },
      });
    } else {
      setLocalPage(newPage);
    }
  };

  const handleSortChange = (newSort: SortState) => {
    if (mode === 'url') {
      navigate({
        search: {
          ...searchParams,
          sortId: newSort.columnId,
          sortDir: newSort.direction,
        },
      });
    } else {
      setLocalSortState(newSort);
    }
  };

  const handleShowDisabledChange = (checked: boolean) => {
    if (mode === 'url') {
      navigate({
        search: {
          ...searchParams,
          showDisabled: checked ? 'true' : undefined,
          page: 1,
        },
      });
    } else {
      setLocalShowDisabled(checked);
      setLocalPage(1);
    }
  };

  return (
    <PracticeSessionTable
      className={className}
      data={paginationData.items}
      focusedId={focusedId}
      isLoading={!!isLoading}
      onCreate={onCreate}
      onDelete={onDelete}
      onEdit={onEdit}
      onFocusedIdChange={handleFocusedIdChange}
      onSearchChange={handleSearchChange}
      onSelectionChange={onSelectionChange}
      onShowDisabledChange={handleShowDisabledChange}
      onSortChange={handleSortChange}
      pagination={{
        currentPage: paginationData.currentPage || 1,
        pageSize: paginationData.pageSize || 10,
        totalItems: paginationData.totalItems || 0,
        totalPages: paginationData.totalPages || 1,
        onPageChange: handlePageChange,
      }}
      search={search}
      selectedIds={selectedIds}
      showDisabled={showDisabled}
      sortState={sortState}
    />
  );
}
