import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import Button from '@/ui/atoms/Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function pageNumbers(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  return Array.from({ length: Math.max(end - adjustedStart + 1, 0) }, (_, index) => adjustedStart + index);
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  loading,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const currentPage = Math.min(Math.max(page, 1), safeTotalPages);
  const firstResult = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const lastResult = Math.min(currentPage * limit, total);
  const disabled = loading || total === 0;

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
      <p className="text-sm text-muted">
        {total === 0 ? '0 results' : `${firstResult}-${lastResult} of ${total} results`}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="search-page-limit" className="flex items-center gap-2 text-sm text-muted">
          <span>Rows</span>
          <select
            id="search-page-limit"
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            {[10, 25, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
            leftIcon={<ChevronFirst className="h-4 w-4" />}
          >
            <span className="sr-only">First</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            <span className="sr-only">Previous</span>
          </Button>

          {pageNumbers(currentPage, safeTotalPages).map((item) => (
            <button
              key={item}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(item)}
              className={clsx(
                'h-8 min-w-8 rounded-lg border px-2 text-sm font-medium transition disabled:opacity-60',
                item === currentPage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-surface'
              )}
              aria-current={item === currentPage ? 'page' : undefined}
            >
              {item}
            </button>
          ))}

          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || currentPage >= safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
            leftIcon={<ChevronRight className="h-4 w-4" />}
          >
            <span className="sr-only">Next</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled || currentPage >= safeTotalPages}
            onClick={() => onPageChange(safeTotalPages)}
            aria-label="Last page"
            leftIcon={<ChevronLast className="h-4 w-4" />}
          >
            <span className="sr-only">Last</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
