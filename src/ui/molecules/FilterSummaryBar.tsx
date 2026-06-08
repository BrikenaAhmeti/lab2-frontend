import clsx from 'clsx';
import { X } from 'lucide-react';
import Button from '@/ui/atoms/Button';

export interface FilterSummaryChip {
  id: string;
  label: string;
  onRemove?: () => void;
}

interface FilterSummaryBarProps {
  chips: FilterSummaryChip[];
  clearLabel?: string;
  className?: string;
  onClear?: () => void;
}

export default function FilterSummaryBar({
  chips,
  clearLabel = 'Clear filters',
  className,
  onClear,
}: FilterSummaryBarProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2',
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-normal text-muted">
        {chips.length} active
      </span>
      {chips.map((chip) =>
        chip.onRemove ? (
          <button
            key={chip.id}
            type="button"
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-3 text-xs font-medium text-primary transition hover:bg-primary/12 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label}`}
          >
            <span>{chip.label}</span>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <span
            key={chip.id}
            className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary/8 px-3 text-xs font-medium text-primary"
          >
            {chip.label}
          </span>
        )
      )}
      {onClear ? (
        <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={onClear}>
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
