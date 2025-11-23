"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import {
  checkboxFilterFn,
  DataTableCheckboxFilter,
} from "@/components/data-table/data-table-checkbox-filter";
import { columnFilterFn } from "@/components/data-table/data-table-column-filter";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSearch } from "@/components/data-table/data-table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";

// Renders the first label with an optional "+N" remainder badge and truncation
function renderFirstWithRemainder(
  label: string,
  moreCount: number,
  maxWidthClass: string
) {
  return (
    <div className={`flex items-center gap-2 pl-3 ${maxWidthClass}`}>
      <span
        className="truncate text-primary underline-offset-4 hover:underline"
        title={label}
      >
        {label}
      </span>
      {moreCount > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "px-1.5",
            "py-[1px]",
            "rounded-[4px]",
            "border",
            "bg-gray-100",
            "text-[11px]",
            "font-medium",
            "text-foreground/70"
          )}
          title={`+${moreCount}`}
        >
          +{moreCount}
        </span>
      ) : null}
    </div>
  );
}

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        className="mr-1"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableGlobalFilter: false,
    size: 40,
  },
  {
    accessorKey: "name",
    header: ({ column, header }) => (
      <DataTableColumnHeader column={column} header={header} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="pl-3 font-medium">{row.getValue("name")}</div>
    ),
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "email",
    header: ({ column, header }) => (
      <DataTableColumnHeader column={column} header={header} title="Email" />
    ),
    cell: ({ row }) => (
      <div className="pl-3 lowercase">{row.getValue("email")}</div>
    ),
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "phone",
    header: ({ column, header }) => (
      <DataTableColumnHeader column={column} header={header} title="Phone" />
    ),
    cell: ({ row }) => <div className="pl-3">{row.getValue("phone")}</div>,
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "status",
    header: ({ column, header }) => (
      <DataTableColumnHeader column={column} header={header} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className="ml-3"
          variant={status === "Active" ? "green" : "gray"}
        >
          {status}
        </Badge>
      );
    },
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "organizations",
    header: ({ column, header }) => (
      <DataTableColumnHeader
        column={column}
        header={header}
        title="Organizations"
      />
    ),
    cell: ({ row }) => {
      const organizations = row.getValue("organizations") as Array<{
        id: string;
        name: string;
      }>;
      const first = organizations[0]?.name ?? "";
      const more = Math.max(organizations.length - 1, 0);
      return renderFirstWithRemainder(first, more, "max-w-[240px]");
    },
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "orgType",
    header: ({ column, header, table }) => {
      // Extract unique orgType values from all rows
      const rows = table.getPreFilteredRowModel().rows;
      const uniqueValues = new Set<string>();
      for (const row of rows) {
        const value = row.getValue("orgType");
        if (value != null) {
          const formatted = String(value).trim();
          if (formatted) {
            uniqueValues.add(formatted);
          }
        }
      }
      const sortedUniqueValues = Array.from(uniqueValues).sort();

      return (
        <DataTableColumnHeader
          column={column}
          header={header}
          renderFilter={(col) => (
            <DataTableCheckboxFilter
              column={col}
              uniqueValues={sortedUniqueValues}
            />
          )}
          title="Org Type"
        />
      );
    },
    cell: ({ row }) => <div className="pl-3">{row.getValue("orgType")}</div>,
    enableGlobalFilter: true,
    filterFn: checkboxFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "roles",
    header: ({ column, header }) => (
      <DataTableColumnHeader column={column} header={header} title="Roles" />
    ),
    cell: ({ row }) => {
      const roles = row.getValue("roles") as string[];
      const first = roles[0] ?? "";
      const more = Math.max(roles.length - 1, 0);
      return renderFirstWithRemainder(first, more, "max-w-[220px]");
    },
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
  {
    accessorKey: "lastLogin",
    header: ({ column, header }) => (
      <DataTableColumnHeader
        column={column}
        header={header}
        title="Last Login"
      />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("lastLogin"));
      return (
        <div className="pl-3 text-sm">
          {date.toLocaleDateString()}{" "}
          {date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      );
    },
    enableGlobalFilter: true,
    filterFn: columnFilterFn,
    size: 170,
    minSize: 150,
  },
];

type UsersTableProps = {
  data: User[];
};

export function UsersTable({ data }: UsersTableProps) {
  const [tableData, setTableData] = useState<User[]>(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  function normalizeForSearch(value: unknown): string {
    if (value == null) {
      return "";
    }
    switch (typeof value) {
      case "string":
        return value.toLowerCase();
      case "number":
      case "boolean":
        return String(value).toLowerCase();
      case "object": {
        if (value instanceof Date) {
          return value.toLocaleString().toLowerCase();
        }
        if (Array.isArray(value)) {
          return value
            .map((v) => normalizeForSearch(v))
            .join(" ")
            .toLowerCase();
        }
        const obj = value as Record<string, unknown>;
        if ("name" in obj && typeof obj.name === "string") {
          return String(obj.name).toLowerCase();
        }
        return Object.values(obj)
          .map((ov) => normalizeForSearch(ov))
          .join(" ")
          .toLowerCase();
      }
      default:
        return "";
    }
  }

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const query = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (query.length === 0) {
        return true;
      }
      const cellValue = row.getValue(columnId);
      return normalizeForSearch(cellValue).includes(query);
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onRowSelectionChange: setRowSelection,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const getDeleteMessage = () => {
    const selectedNames = selectedRows.map((row) => row.original.name);
    if (selectedCount === 1) {
      return `Are you sure you want to delete ${selectedNames[0]}?`;
    }
    const namesList = selectedNames.join(", ");
    return `Are you sure you want to delete ${selectedCount.toLocaleString()} users: ${namesList}?`;
  };

  const handleDelete = () => {
    const idsToDelete = selectedRows.map((row) => row.original.id);
    setTableData((prev) =>
      prev.filter((user) => !idsToDelete.includes(user.id))
    );
    setRowSelection({});
    setConfirmOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <DataTableSearch
        className="mb-4 shrink-0"
        debounceMs={250}
        onValueChange={setGlobalFilter}
        placeholder="Search"
        value={globalFilter}
      />
      <Card className="flex min-h-0 w-full flex-1 flex-col rounded-none">
        <CardHeader className="px-4 py-1.5 text-sm">
          <div className="flex items-center justify-between">
            <div>
              {selectedCount > 0
                ? `${selectedCount.toLocaleString()} items selected`
                : `${table
                    .getFilteredRowModel()
                    .rows.length.toLocaleString()} items found`}
            </div>
            <Button
              aria-label="delete"
              disabled={selectedCount === 0}
              onClick={() => setConfirmOpen(true)}
              size="icon"
              type="button"
              variant="outline"
            >
              <Trash className="text-brand-blue" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 overflow-hidden border p-0">
          <div className="min-h-0 flex-1 overflow-auto">
            <Table
              className="min-w-full table-fixed text-sm"
              style={{ width: table.getTotalSize() }}
            >
              <TableHeader className="[&_th]:py-1">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          className="relative select-none"
                          key={header.id}
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="[&_td]:py-3">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      className="hover:bg-sky-100/50 data-[state=selected]:bg-sky-100"
                      data-state={row.getIsSelected() && "selected"}
                      key={row.id}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center"
                      colSpan={columns.length}
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end p-0">
          <DataTablePagination table={table} />
        </CardFooter>
      </Card>
      <Dialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected items?</DialogTitle>
            <DialogDescription>{getDeleteMessage()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleDelete} type="button" variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
