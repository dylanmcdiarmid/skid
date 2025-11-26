"use client";

import type { Column } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export type FilterOperator =
  | "contains"
  | "does-not-contain"
  | "equals"
  | "does-not-equal"
  | "begins-with"
  | "ends-with"
  | "blank"
  | "not-blank";

export type ColumnFilterValue = {
  operator1: FilterOperator;
  value1: string;
  logic?: "AND" | "OR";
  operator2?: FilterOperator;
  value2?: string;
};

interface DataTableColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

const FILTER_OPERATORS: Array<{ value: FilterOperator; label: string }> = [
  { value: "contains", label: "Contains" },
  { value: "does-not-contain", label: "Does not contain" },
  { value: "equals", label: "Equals" },
  { value: "does-not-equal", label: "Does not equal" },
  { value: "begins-with", label: "Begins with" },
  { value: "ends-with", label: "Ends with" },
  { value: "blank", label: "Blank" },
  { value: "not-blank", label: "Not blank" },
];

const OPERATORS_REQUIRING_VALUE: FilterOperator[] = [
  "contains",
  "does-not-contain",
  "equals",
  "does-not-equal",
  "begins-with",
  "ends-with",
];

function isValueRequired(operator: FilterOperator): boolean {
  return OPERATORS_REQUIRING_VALUE.includes(operator);
}

/**
 * Normalizes a cell value to a string for comparison
 */
function normalizeForFilter(value: unknown): string {
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
          .map((v) => normalizeForFilter(v))
          .join(" ")
          .toLowerCase();
      }
      const obj = value as Record<string, unknown>;
      if ("name" in obj && typeof obj.name === "string") {
        return String(obj.name).toLowerCase();
      }
      return Object.values(obj)
        .map((ov) => normalizeForFilter(ov))
        .join(" ")
        .toLowerCase();
    }
    default:
      return "";
  }
}

/**
 * Checks if a value is blank (null, undefined, empty string, or empty array)
 */
function isBlank(value: unknown): boolean {
  if (value == null) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/**
 * Evaluates a single filter condition
 */
function evaluateCondition(
  cellValue: unknown,
  operator: FilterOperator,
  filterValue: string
): boolean {
  // Handle blank/not-blank operators
  if (operator === "blank") {
    return isBlank(cellValue);
  }
  if (operator === "not-blank") {
    return !isBlank(cellValue);
  }

  // For other operators, normalize both values
  const normalizedCell = normalizeForFilter(cellValue);
  const normalizedFilter = filterValue.toLowerCase().trim();

  if (normalizedFilter.length === 0) {
    return true; // Empty filter matches everything
  }

  // biome-ignore lint/nursery/noUnnecessaryConditions: switch case
  switch (operator) {
    case "contains":
      return normalizedCell.includes(normalizedFilter);
    case "does-not-contain":
      return !normalizedCell.includes(normalizedFilter);
    case "equals":
      return normalizedCell === normalizedFilter;
    case "does-not-equal":
      return normalizedCell !== normalizedFilter;
    case "begins-with":
      return normalizedCell.startsWith(normalizedFilter);
    case "ends-with":
      return normalizedCell.endsWith(normalizedFilter);
    default:
      return true;
  }
}

/**
 * Custom filter function for TanStack Table columns
 * Evaluates filter conditions with AND/OR logic
 */
export function columnFilterFn(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: ColumnFilterValue | undefined
): boolean {
  if (!filterValue) {
    return true;
  }

  const cellValue = row.getValue(columnId);
  const result1 = evaluateCondition(
    cellValue,
    filterValue.operator1,
    filterValue.value1
  );

  // If no second condition, return first result
  if (!filterValue.operator2) {
    return result1;
  }

  const result2 = evaluateCondition(
    cellValue,
    filterValue.operator2,
    filterValue.value2 ?? ""
  );

  // Combine results with AND/OR logic
  if (filterValue.logic === "OR") {
    return result1 || result2;
  }
  return result1 && result2;
}

export function DataTableColumnFilter<TData, TValue>({
  column,
}: DataTableColumnFilterProps<TData, TValue>) {
  const currentFilter = column.getFilterValue() as
    | ColumnFilterValue
    | undefined;

  const [operator1, setOperator1] = useState<FilterOperator>(
    currentFilter?.operator1 ?? "contains"
  );
  const [value1, setValue1] = useState<string>(currentFilter?.value1 ?? "");
  const [logic, setLogic] = useState<"AND" | "OR">(
    currentFilter?.logic ?? "AND"
  );
  const [operator2, setOperator2] = useState<FilterOperator>(
    currentFilter?.operator2 ?? "contains"
  );
  const [value2, setValue2] = useState<string>(currentFilter?.value2 ?? "");

  // Sync with column filter value when it changes externally
  useEffect(() => {
    const filter = column.getFilterValue() as ColumnFilterValue | undefined;
    if (filter) {
      setOperator1(filter.operator1 ?? "contains");
      setValue1(filter.value1 ?? "");
      setLogic(filter.logic ?? "AND");
      setOperator2(filter.operator2 ?? "contains");
      setValue2(filter.value2 ?? "");
    } else {
      // Reset if filter is cleared externally
      setOperator1("contains");
      setValue1("");
      setLogic("AND");
      setOperator2("contains");
      setValue2("");
    }
  }, [column]);

  // Update column filter when local state changes
  useEffect(() => {
    const hasFirstFilter =
      !isValueRequired(operator1) || value1.trim().length > 0;
    const hasSecondFilter =
      hasFirstFilter &&
      (!isValueRequired(operator2) || value2.trim().length > 0);

    if (!hasFirstFilter) {
      // Clear filter if no conditions
      column.setFilterValue(undefined);
      return;
    }

    const filterValue: ColumnFilterValue = {
      operator1,
      value1: value1.trim(),
      ...(hasSecondFilter
        ? {
            logic,
            operator2,
            value2: value2.trim(),
          }
        : {}),
    };

    column.setFilterValue(filterValue);
  }, [operator1, value1, logic, operator2, value2, column]);

  const showSecondFilter =
    !isValueRequired(operator1) || value1.trim().length > 0;
  const value1Required = isValueRequired(operator1);
  const value2Required = isValueRequired(operator2);

  return (
    <DropdownMenuContent align="start" className="w-[280px] bg-gray-100 p-4">
      <div className="space-y-4">
        {/* First Filter */}
        <div className="space-y-2">
          <Select
            onChange={(e) => setOperator1(e.target.value as FilterOperator)}
            value={operator1}
          >
            {FILTER_OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>
          {value1Required && (
            <Input
              onChange={(e) => setValue1(e.target.value)}
              placeholder="Filter value"
              value={value1}
            />
          )}
        </div>

        {/* AND/OR Logic and Second Filter */}
        {showSecondFilter && (
          <>
            <RadioGroup
              className="flex items-center justify-center gap-6"
              onValueChange={(value) => setLogic(value as "AND" | "OR")}
              value={logic}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="AND" value="AND" />
                <Label htmlFor="AND">AND</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="OR" value="OR" />
                <Label htmlFor="OR">OR</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Select
                onChange={(e) => setOperator2(e.target.value as FilterOperator)}
                value={operator2}
              >
                {FILTER_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </Select>
              {value2Required && (
                <Input
                  onChange={(e) => setValue2(e.target.value)}
                  placeholder="Filter value"
                  value={value2}
                />
              )}
            </div>
          </>
        )}
      </div>
    </DropdownMenuContent>
  );
}
