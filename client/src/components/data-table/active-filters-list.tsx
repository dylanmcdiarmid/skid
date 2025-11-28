import { XMarkIcon } from '@heroicons/react/24/outline';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ActiveFilter {
  id: string;
  label: string;
  value?: string;
  onRemove: () => void;
  colorClass?: string; // Optional class override for the badge
}

interface ActiveFiltersListProps {
  filters: ActiveFilter[];
  className?: string;
}

export function ActiveFiltersList({
  filters,
  className,
}: ActiveFiltersListProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter) => (
        <Badge
          className={cn(
            'cursor-pointer gap-1 pr-1 transition-colors hover:bg-secondary/80',
            filter.colorClass
          )}
          key={filter.id}
          onClick={filter.onRemove}
          variant="secondary"
        >
          <span className="mr-1">{filter.label}</span>
          {filter.value && (
            <span className="font-normal text-muted-foreground">
              {filter.value}
            </span>
          )}
          <XMarkIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </Badge>
      ))}
    </div>
  );
}
