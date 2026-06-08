import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Calendar, CalendarRange, Check, ChevronDown, X } from 'lucide-react';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';

export type DateModeFilterMode = 'single' | 'range';

export interface DateModeFilterValue {
  mode: DateModeFilterMode;
  singleDate: string;
  rangeStartDate: string;
  rangeEndDate: string;
}

export interface DateModeFilterRange {
  from?: string;
  to?: string;
}

interface DateModeFilterProps {
  id: string;
  label: string;
  value: DateModeFilterValue;
  className?: string;
  panelAlign?: 'left' | 'right';
  disabled?: boolean;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  singleDateLabel?: string;
  rangeStartLabel?: string;
  rangeEndLabel?: string;
  onChange: (value: DateModeFilterValue) => void;
}

export const emptyDateModeFilterValue: DateModeFilterValue = {
  mode: 'single',
  singleDate: '',
  rangeStartDate: '',
  rangeEndDate: '',
};

function formatInputDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function dateModeFilterToRange(value: DateModeFilterValue): DateModeFilterRange {
  if (value.mode === 'single') {
    return value.singleDate
      ? {
          from: value.singleDate,
          to: value.singleDate,
        }
      : {};
  }

  return {
    from: value.rangeStartDate || undefined,
    to: value.rangeEndDate || undefined,
  };
}

export function isDateModeFilterActive(value: DateModeFilterValue) {
  return value.mode === 'single'
    ? Boolean(value.singleDate)
    : Boolean(value.rangeStartDate || value.rangeEndDate);
}

export function formatDateModeFilterSummary(value: DateModeFilterValue) {
  if (value.mode === 'single') {
    return formatInputDate(value.singleDate);
  }

  const start = value.rangeStartDate ? formatInputDate(value.rangeStartDate) : 'Any start';
  const end = value.rangeEndDate ? formatInputDate(value.rangeEndDate) : 'Any end';

  return `${start} - ${end}`;
}

export default function DateModeFilter({
  id,
  label,
  value,
  className,
  panelAlign = 'right',
  disabled,
  placeholder = 'Any date',
  minDate,
  maxDate,
  singleDateLabel = 'Date',
  rangeStartLabel = 'From',
  rangeEndLabel = 'To',
  onChange,
}: DateModeFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isDateModeFilterActive(value);
  const summary = active ? formatDateModeFilterSummary(value) : placeholder;
  const panelId = `${id}-panel`;
  const labelId = `${id}-label`;
  const summaryId = `${id}-summary`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selectMode = (mode: DateModeFilterMode) => {
    onChange({ ...value, mode });
  };

  const clearFilter = () => {
    onChange(emptyDateModeFilterValue);
  };

  return (
    <div className={clsx('relative space-y-1.5', className)} ref={containerRef}>
      <span id={labelId} className="block text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          className={clsx(
            'flex min-h-[42px] w-full items-center gap-2 rounded-xl border border-border bg-background py-2.5 pl-3 pr-10 text-left text-sm text-foreground outline-none transition hover:bg-surface/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
            active && 'border-primary/60 bg-primary/5 pr-20'
          )}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          aria-labelledby={`${labelId} ${summaryId}`}
        >
          <Calendar className={clsx('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted')} aria-hidden="true" />
          <span id={summaryId} className={clsx('min-w-0 flex-1 truncate', active ? 'font-medium' : 'text-muted')}>
            {summary}
          </span>
          <ChevronDown
            className={clsx('h-4 w-4 shrink-0 text-muted transition', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {active ? (
          <button
            type="button"
            className="absolute right-10 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={disabled}
            onClick={clearFilter}
            aria-label={`Clear ${label.toLowerCase()} filter`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open ? (
        <section
          id={panelId}
          className={clsx(
            'absolute top-[calc(100%+0.5rem)] z-40 w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-panel',
            panelAlign === 'left' ? 'left-0' : 'right-0'
          )}
          role="dialog"
          aria-labelledby={labelId}
        >
          <div className="grid grid-cols-2 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              className={clsx(
                'inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                value.mode === 'single' ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted hover:bg-surface'
              )}
              disabled={disabled}
              onClick={() => selectMode('single')}
              aria-pressed={value.mode === 'single'}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              Single
            </button>
            <button
              type="button"
              className={clsx(
                'inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
                value.mode === 'range' ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted hover:bg-surface'
              )}
              disabled={disabled}
              onClick={() => selectMode('range')}
              aria-pressed={value.mode === 'range'}
            >
              <CalendarRange className="h-4 w-4" aria-hidden="true" />
              Range
            </button>
          </div>

          {value.mode === 'single' ? (
            <div className="mt-3">
              <CalendarDatePicker
                id={`${id}-single-date`}
                label={singleDateLabel}
                value={value.singleDate}
                min={minDate}
                max={maxDate}
                disabled={disabled}
                onChange={(date) => onChange({ ...value, singleDate: date })}
              />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <CalendarDatePicker
                id={`${id}-range-start-date`}
                label={rangeStartLabel}
                value={value.rangeStartDate}
                min={minDate}
                max={value.rangeEndDate || maxDate}
                disabled={disabled}
                onChange={(date) => onChange({ ...value, rangeStartDate: date })}
              />
              <CalendarDatePicker
                id={`${id}-range-end-date`}
                label={rangeEndLabel}
                value={value.rangeEndDate}
                min={value.rangeStartDate || minDate}
                max={maxDate}
                disabled={disabled}
                onChange={(date) => onChange({ ...value, rangeEndDate: date })}
              />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled || !active}
              onClick={clearFilter}
            >
              Clear
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              onClick={() => setOpen(false)}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Done
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
