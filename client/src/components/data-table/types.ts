import type { ReactNode } from 'react';

export interface ColumnDef<T> {
  header: string | ReactNode;
  accessorKey: keyof T | string;
  cell?: (item: T) => ReactNode;
  enableSorting?: boolean;
  sortKey?: string;
  className?: string;
}

export interface SortState {
  columnId: string | null; // accessorKey or sortKey
  direction: 'asc' | 'desc' | null;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  sortState?: SortState;
  onSortChange?: (sortState: SortState) => void;

  // Row expansion
  expandedRowRender?: (item: T) => ReactNode;

  // Selection
  selectedIds?: string[]; // Assuming T has an 'id' property, or we might need a way to identify rows
  onSelectionChange?: (selectedIds: string[]) => void;

  // Interaction modes
  focusOnClick?: boolean;
  selectOnClick?: boolean;
  expandOnClick?: boolean;

  // Key to use as unique identifier for rows (defaults to 'id')
  rowKey?: keyof T;

  className?: string;
}
