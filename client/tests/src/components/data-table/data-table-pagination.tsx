import type { Table } from "@tanstack/react-table";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
};

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);
  return (
    <div className="flex items-center gap-6 px-2 py-2">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <p className="text-sm">Page Size:</p>
        <Select
          className="h-8 w-[70px] bg-white"
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          value={table.getState().pagination.pageSize}
        >
          {[10, 20, 25, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
      {/* Range summary */}
      <div className="text-muted-foreground text-sm">
        <span className="font-bold">{start.toLocaleString()}</span> to{" "}
        <span className="font-bold">{end.toLocaleString()}</span> of{" "}
        <span className="font-bold">{total.toLocaleString()}</span>
      </div>

      {/* Pager controls */}
      <div className="flex items-center gap-2">
        <Button
          className="hidden size-8 lg:flex"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.setPageIndex(0)}
          size="icon"
          variant="ghost"
        >
          <span className="sr-only">Go to first page</span>
          <ChevronFirst />
        </Button>
        <Button
          className="size-8"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
          size="icon"
          variant="ghost"
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft />
        </Button>

        {/* Page x of y */}
        <div className="text-sm">
          Page{" "}
          <span className="font-bold">
            {table.getState().pagination.pageIndex + 1}
          </span>{" "}
          of <span className="font-bold">{table.getPageCount()}</span>
        </div>

        <Button
          className="size-8"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
          size="icon"
          variant="ghost"
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight />
        </Button>
        <Button
          className="hidden size-8 lg:flex"
          disabled={!table.getCanNextPage()}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          size="icon"
          variant="ghost"
        >
          <span className="sr-only">Go to last page</span>
          <ChevronLast />
        </Button>
      </div>
    </div>
  );
}
