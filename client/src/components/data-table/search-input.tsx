import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;

  // Optional column selection for search
  searchableColumns?: { label: string; value: string }[];
  selectedColumn?: string;
  onColumnChange?: (column: string) => void;

  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  searchableColumns,
  selectedColumn,
  onColumnChange,
  className,
}: SearchInputProps) {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-icon-muted" />
        <Input
          className="h-9 pl-8"
          onChange={handleInputChange}
          placeholder={placeholder}
          type="text"
          value={value}
        />
      </div>

      {searchableColumns && searchableColumns.length > 0 && onColumnChange && (
        <Select
          className="w-[140px]"
          onChange={(e) => onColumnChange(e.target.value)}
          value={selectedColumn}
        >
          <option disabled hidden value="">
            Column
          </option>
          {searchableColumns.map((col) => (
            <option key={col.value} value={col.value}>
              {col.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
