import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

type FilterField = {
  columnId: string;
  placeholder: string;
  className?: string;
};

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  filterFields?: FilterField[];
  showViewOptions?: boolean;
};

export function DataTableToolbar<TData>({
  table,
  filterFields = [
    {
      columnId: "email",
      placeholder: "Filter emails...",
      className: "h-8 w-[150px] lg:w-[250px]",
    },
  ],
  showViewOptions = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {filterFields.map((field) => (
          <Input
            className={field.className || "h-8 w-[150px] lg:w-[250px]"}
            key={field.columnId}
            onChange={(event) =>
              table
                .getColumn(field.columnId)
                ?.setFilterValue(event.target.value)
            }
            placeholder={field.placeholder}
            value={
              (table.getColumn(field.columnId)?.getFilterValue() as string) ??
              ""
            }
          />
        ))}
        {isFiltered && (
          <Button
            className="h-8 px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
            variant="ghost"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {showViewOptions && <DataTableViewOptions table={table} />}
    </div>
  );
}
