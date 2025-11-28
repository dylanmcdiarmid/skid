import { PlusCircleIcon } from '@heroicons/react/24/outline';
import type React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FacetedFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FacetedFilterProps {
  title: string;
  options: FacetedFilterOption[];
  selectedValues: Set<string>;
  onSelect: (value: string) => void;
  onClear?: () => void;
}

export function FacetedFilter({
  title,
  options,
  selectedValues,
  onSelect,
  onClear,
}: FacetedFilterProps) {
  const selectedCount = selectedValues.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 border-dashed" size="sm" variant="outline">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedCount > 0 && (
            <>
              <div className="ml-1 h-4 w-[1px] bg-border" />
              <Badge
                className="ml-1 rounded-sm px-1 font-normal lg:hidden"
                variant="secondary"
              >
                {selectedCount}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedCount > 2 ? (
                  <Badge
                    className="ml-1 rounded-sm px-1 font-normal"
                    variant="secondary"
                  >
                    {selectedCount} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        className="ml-1 rounded-sm px-1 font-normal"
                        key={option.value}
                        variant="secondary"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
            Filter by {title}
          </DropdownMenuLabel>
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value);
            return (
              <DropdownMenuCheckboxItem
                checked={isSelected}
                key={option.value}
                onCheckedChange={() => onSelect(option.value)}
              >
                {option.icon && (
                  <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                <span>{option.label}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
        {selectedCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-center"
              onSelect={onClear}
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
