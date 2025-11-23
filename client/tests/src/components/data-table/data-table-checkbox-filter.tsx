"use client";

import type { Column } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuContent } from "../ui/dropdown-menu";
import { Label } from "../ui/label";

interface DataTableCheckboxFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  uniqueValues: string[];
}

/**
 * Filter function for checkbox-based multi-select filters
 * Filter value format: string[] | undefined
 * - undefined = all selected (show all rows)
 * - [] = none selected (show no rows)
 * - string[] = show only rows matching values in array
 */
export function checkboxFilterFn(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: string[] | undefined
): boolean {
  if (filterValue === undefined) {
    return true; // All selected, show all rows
  }
  if (filterValue.length === 0) {
    return false; // None selected, show no rows
  }

  const cellValue = String(row.getValue(columnId) ?? "")
    .toLowerCase()
    .trim();
  return filterValue.some(
    (selected) => selected.toLowerCase().trim() === cellValue
  );
}

export function DataTableCheckboxFilter<TData, TValue>({
  column,
  uniqueValues,
}: DataTableCheckboxFilterProps<TData, TValue>) {
  const currentFilter = column.getFilterValue() as string[] | undefined;

  // Track selected values
  // Initialize based on current filter value
  const [selectedValues, setSelectedValues] = useState<Set<string>>(() => {
    if (currentFilter === undefined) {
      return new Set(uniqueValues);
    }
    if (Array.isArray(currentFilter)) {
      return new Set(currentFilter);
    }
    return new Set(uniqueValues);
  });

  // Sync with column filter value when it changes externally
  useEffect(() => {
    if (currentFilter === undefined) {
      // All selected - sync with all unique values
      setSelectedValues((prev) => {
        const allSelected = new Set(uniqueValues);
        // Only update if different to avoid unnecessary re-renders
        if (
          prev.size !== allSelected.size ||
          !Array.from(allSelected).every((v) => prev.has(v))
        ) {
          return allSelected;
        }
        return prev;
      });
    } else if (Array.isArray(currentFilter)) {
      // Some or none selected - sync with filter value
      setSelectedValues((prev) => {
        const filterSet = new Set(currentFilter);
        // Only update if different to avoid unnecessary re-renders
        if (
          prev.size !== filterSet.size ||
          !Array.from(filterSet).every((v) => prev.has(v))
        ) {
          return filterSet;
        }
        return prev;
      });
    }
  }, [currentFilter, uniqueValues]);

  const handleToggle = (value: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      // Update column filter immediately based on new selection
      if (next.size === uniqueValues.length) {
        // All selected - clear filter
        column.setFilterValue(undefined);
      } else if (next.size === 0) {
        // None selected - set empty array
        column.setFilterValue([]);
      } else {
        // Some selected - set array of selected values
        column.setFilterValue(Array.from(next));
      }

      return next;
    });
  };

  return (
    <DropdownMenuContent
      align="start"
      className="flex w-[200px] flex-col gap-2 p-2"
    >
      {uniqueValues.map((value) => (
        <div className="flex items-center gap-3" key={value}>
          <Checkbox
            checked={selectedValues.has(value)}
            id={value}
            onCheckedChange={() => handleToggle(value)}
          />
          <Label htmlFor={value}>{value}</Label>
        </div>
      ))}
    </DropdownMenuContent>
  );
}
