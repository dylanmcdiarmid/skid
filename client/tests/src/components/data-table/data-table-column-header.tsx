import type { Column, Header } from "@tanstack/react-table";
import { ListFilter } from "lucide-react";
import { DataTableColumnFilter } from "@/components/data-table/data-table-column-filter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  header: Header<TData, TValue>;
  title: string;
  renderFilter?: (column: Column<TData, TValue>) => React.ReactNode;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  header,
  title,
  className,
  renderFilter,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const resizeHandler = header.getResizeHandler();
  const isResizing = column.getIsResizing();

  const filterComponent = renderFilter ? (
    renderFilter(column)
  ) : (
    <DataTableColumnFilter column={column} />
  );

  return (
    <div
      className={cn(
        "relative flex h-12 select-none items-center justify-between gap-2",
        className
      )}
    >
      <Button
        className="h-8 cursor-pointer hover:bg-transparent hover:text-inherit"
        size="sm"
        type="button"
        variant="ghost"
      >
        <span>{title}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="filter"
            className="cursor-pointer hover:bg-transparent hover:text-inherit"
            size="icon"
            type="button"
            variant="ghost"
          >
            <ListFilter />
          </Button>
        </DropdownMenuTrigger>
        {filterComponent}
      </DropdownMenu>
      <Button
        aria-label="Resize column"
        className={cn(
          "absolute top-[16px] right-[-8px] bottom-[16px] h-4 w-[2px] cursor-col-resize touch-none bg-border text-border content-['']",
          isResizing && "bg-neutral-200"
        )}
        onMouseDown={resizeHandler}
        onTouchStart={resizeHandler}
        size="icon"
        type="button"
        variant="ghost"
      />
    </div>
  );
}
