import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  disableMode?: 'loading' | 'static'; // 'loading' disables on load, 'static' keeps enabled
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  isLoading = false,
  disableMode = 'loading',
  className,
}: PaginationProps) {
  const isDisabled = disableMode === 'loading' && isLoading;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || isDisabled) {
      return;
    }
    onPageChange(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="text-muted-foreground text-sm">
        Page {currentPage} of {totalPages} ({totalItems} items)
      </div>

      <div className="flex items-center gap-1">
        <Button
          aria-label="Previous page"
          className="h-8 w-8"
          disabled={currentPage === 1 || isDisabled}
          onClick={() => handlePageChange(currentPage - 1)}
          size="icon"
          variant="outline"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <div className="mx-2 flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <span
                className="px-2 text-text-muted"
                key={`ellipsis-${`${page}-${String(index)}`}`}
              >
                ...
              </span>
            ) : (
              <Button
                className={cn(
                  'h-8 w-8 p-0',
                  currentPage === page &&
                    'pointer-events-none bg-brand-accent text-white hover:bg-brand-accent/90'
                )}
                disabled={isDisabled}
                key={page}
                onClick={() => handlePageChange(page as number)}
                size="sm"
                variant={currentPage === page ? 'default' : 'outline'}
              >
                {page}
              </Button>
            )
          )}
        </div>

        <Button
          aria-label="Next page"
          className="h-8 w-8"
          disabled={currentPage === totalPages || isDisabled}
          onClick={() => handlePageChange(currentPage + 1)}
          size="icon"
          variant="outline"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
