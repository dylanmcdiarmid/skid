import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import React, { type ReactNode, useCallback, useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DataTableProps } from './types';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  sortState,
  onSortChange,
  expandedRowRender,
  selectedIds,
  onSelectionChange,
  focusOnClick = true,
  selectOnClick = false,
  expandOnClick = false,
  rowKey = 'id',
  className,
}: DataTableProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Helper to get ID from row
  const getRowId = useCallback(
    (item: T): string => {
      return String(item[rowKey] ?? '');
    },
    [rowKey]
  );

  // Toggle row expansion
  const toggleExpansion = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle row click
  const handleRowClick = (item: T) => {
    const id = getRowId(item);

    if (focusOnClick) {
      setFocusedId(id);
    }

    if (selectOnClick && onSelectionChange && selectedIds) {
      const isSelected = selectedIds.includes(id);
      if (isSelected) {
        onSelectionChange(selectedIds.filter((sid) => sid !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    }

    if (expandOnClick && expandedRowRender) {
      toggleExpansion(id);
    }
  };

  // Handle sort click
  const handleSortClick = (columnId: string) => {
    if (!(onSortChange && sortState)) {
      return;
    }

    const isCurrent = sortState.columnId === columnId;
    let direction: 'asc' | 'desc' | null = 'asc';

    if (isCurrent) {
      if (sortState.direction === 'asc') {
        direction = 'desc';
      } else if (sortState.direction === 'desc') {
        direction = null;
      }
    }

    onSortChange({
      columnId: direction ? columnId : null,
      direction,
    });
  };

  // Handle "Select All"
  const handleSelectAll = () => {
    if (!(onSelectionChange && selectedIds)) {
      return;
    }

    const allIds = data.map(getRowId);
    const areAllSelected = allIds.every((id) => selectedIds.includes(id));

    if (areAllSelected) {
      onSelectionChange([]);
    } else {
      // Only select visible rows
      onSelectionChange(allIds);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedId) {
        return;
      }

      const currentIndex = data.findIndex(
        (item) => getRowId(item) === focusedId
      );
      if (currentIndex === -1) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(data.length - 1, currentIndex + 1);
        setFocusedId(getRowId(data[nextIndex]));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(0, currentIndex - 1);
        setFocusedId(getRowId(data[prevIndex]));
      } else if (e.key === 'Escape') {
        setFocusedId(null);
      } else if (e.key === ' ' || e.key === 'Enter') {
        // Space/Enter on focused row triggers primary action (expand or select)
        // If not handling selectOnClick/expandOnClick, we can do default expand toggle
        e.preventDefault();
        const item = data[currentIndex];
        const id = getRowId(item);

        if (expandedRowRender) {
          toggleExpansion(id);
        } else if (onSelectionChange && selectedIds) {
          // If no expand, maybe toggle selection?
          const isSelected = selectedIds.includes(id);
          if (isSelected) {
            onSelectionChange(selectedIds.filter((sid) => sid !== id));
          } else {
            onSelectionChange([...selectedIds, id]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedId,
    data,
    getRowId,
    expandedRowRender,
    onSelectionChange,
    selectedIds,
    toggleExpansion,
  ]);

  // Clear focus on outside click (simplified: just clearing on unmount or specific triggers if needed)
  // For actual "click outside", we'd need a ref on the table and a global click listener.
  // User requirement: "Clicking outside the table should clear focus."
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-slot="table-container"]')) {
        setFocusedId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSelectionColumn = !!onSelectionChange && !!selectedIds;
  const showExpandColumn = !!expandedRowRender && !expandOnClick; // Explicit expand column if not click-to-expand

  return (
    <div className={cn('relative flex h-full flex-col', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showSelectionColumn && (
              <TableHead className="w-[40px]">
                <Checkbox
                  aria-label="Select all"
                  checked={
                    data.length > 0 &&
                    data.every((item) => selectedIds.includes(getRowId(item)))
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            {showExpandColumn && <TableHead className="w-[40px]" />}
            {columns.map((col) => {
              const sortKey = col.sortKey || (col.accessorKey as string);
              const isSorted = sortState?.columnId === sortKey;

              return (
                <TableHead
                  className={cn(
                    col.enableSorting &&
                      'cursor-pointer select-none hover:bg-hover-subtle',
                    col.className
                  )}
                  key={col.accessorKey as string}
                  onClick={() => col.enableSorting && handleSortClick(sortKey)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.enableSorting && isSorted && (
                      <span className="text-muted-foreground">
                        {sortState?.direction === 'asc' ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const id = getRowId(item);
            const isExpanded = expandedIds.has(id);
            const isFocused = focusedId === id;
            const isSelected = selectedIds?.includes(id);

            return (
              <React.Fragment key={id}>
                <TableRow
                  className={cn(
                    'cursor-default',
                    isFocused &&
                      'bg-neutral-100 ring-1 ring-brand-accent ring-inset dark:bg-neutral-800',
                    (focusOnClick || selectOnClick || expandOnClick) &&
                      'cursor-pointer'
                  )}
                  data-state={isSelected ? 'selected' : undefined}
                  onClick={() => handleRowClick(item)}
                >
                  {showSelectionColumn && (
                    <TableCell
                      className="w-[40px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Stop propagation so clicking checkbox doesn't trigger row click logic if redundant */}
                      <Checkbox
                        aria-label="Select row"
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (onSelectionChange && selectedIds) {
                            if (checked) {
                              onSelectionChange([...selectedIds, id]);
                            } else {
                              onSelectionChange(
                                selectedIds.filter((sid) => sid !== id)
                              );
                            }
                          }
                        }}
                      />
                    </TableCell>
                  )}
                  {showExpandColumn && (
                    <TableCell className="w-[40px]">
                      <button
                        className="rounded p-1 hover:bg-hover-subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpansion(id);
                        }}
                        type="button"
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell
                      className={col.className}
                      key={col.accessorKey as string}
                    >
                      {col.cell
                        ? col.cell(item)
                        : (item[col.accessorKey as keyof T] as ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
                {isExpanded && expandedRowRender && (
                  <TableRow className="bg-surface-sunken hover:bg-surface-sunken">
                    <TableCell
                      className="p-0"
                      colSpan={
                        columns.length +
                        (showSelectionColumn ? 1 : 0) +
                        (showExpandColumn ? 1 : 0)
                      }
                    >
                      <div className="border-b p-4">
                        {expandedRowRender(item)}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
          {data.length === 0 && !isLoading && (
            <TableRow>
              <TableCell
                className="h-24 text-center"
                colSpan={
                  columns.length +
                  (showSelectionColumn ? 1 : 0) +
                  (showExpandColumn ? 1 : 0)
                }
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-overlay-bg backdrop-blur-[1px]">
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
