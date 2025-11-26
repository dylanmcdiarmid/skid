"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DataTableSearchProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

export function DataTableSearch({
  value,
  onValueChange,
  placeholder = "Search",
  debounceMs = 250,
  className,
}: DataTableSearchProps) {
  const [internalValue, setInternalValue] = useState<string>(value);

  const ICON_CLASS =
    "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none size-4 text-muted-foreground";
  const INPUT_CLASS = "w-full h-10 rounded-full pl-9 pr-9 shadow-sm bg-white";
  const CLEAR_BTN_CLASS =
    "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted";

  // Keep internal value in sync when parent changes it programmatically
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce notifying the parent0
  useEffect(() => {
    const handle = setTimeout(() => {
      if (internalValue !== value) {
        onValueChange(internalValue);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [debounceMs, internalValue, onValueChange, value]);

  const clearVisible = useMemo(() => internalValue.length > 0, [internalValue]);

  return (
    <div className={cn("w-75", className)}>
      <div className="relative">
        <Search aria-hidden="true" className={ICON_CLASS} />
        <Input
          aria-label="Search table"
          className={cn(
            INPUT_CLASS,
            "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
          )}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          type="search"
          value={internalValue}
        />
        {clearVisible ? (
          <button
            aria-label="Clear search"
            className={CLEAR_BTN_CLASS}
            onClick={() => setInternalValue("")}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default DataTableSearch;
