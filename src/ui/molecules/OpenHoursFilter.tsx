import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { CalendarClock, Check, ChevronDown, Clock, X } from 'lucide-react';
import Input from '@/ui/atoms/Input';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';
import {
  emptyOpenHoursFilterValue,
  formatOpenHoursFilterSummary,
  isOpenHoursFilterActive,
  type OpenHoursFilterMode,
  type OpenHoursFilterValue,
} from '@/ui/molecules/OpenHoursFilter.utils';

interface OpenHoursFilterProps {
  id: string;
  label: string;
  value: OpenHoursFilterValue;
  className?: string;
  disabled?: boolean;
  onChange: (value: OpenHoursFilterValue) => void;
}

export default function OpenHoursFilter({
  id,
  label,
  value,
  className,
  disabled,
  onChange,
}: OpenHoursFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isOpenHoursFilterActive(value);
  const summary = active ? formatOpenHoursFilterSummary(value) : 'Any date and time';
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

  const selectMode = (mode: OpenHoursFilterMode) => {
    onChange({ ...value, mode });
  };

  const clearFilter = () => {
    onChange(emptyOpenHoursFilterValue);
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
          <CalendarClock className={clsx('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted')} aria-hidden="true" />
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
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(44rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-panel"
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
              <Clock className="h-4 w-4" aria-hidden="true" />
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
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Range
            </button>
          </div>

          {value.mode === 'single' ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem]">
              <CalendarDatePicker
                id={`${id}-single-date`}
                label="Date"
                value={value.singleDate}
                disabled={disabled}
                onChange={(nextDate) => onChange({ ...value, singleDate: nextDate })}
              />
              <div className="rounded-xl border border-border bg-surface/50 p-3">
                <Input
                  id={`${id}-single-time`}
                  label="Time"
                  type="time"
                  value={value.singleTime}
                  disabled={disabled}
                  onChange={(event) => onChange({ ...value, singleTime: event.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-3">
                <CalendarDatePicker
                  id={`${id}-range-start-date`}
                  label="Start date"
                  value={value.rangeStartDate}
                  max={value.rangeEndDate || undefined}
                  disabled={disabled}
                  onChange={(nextDate) => onChange({ ...value, rangeStartDate: nextDate })}
                />
                <Input
                  id={`${id}-range-start-time`}
                  label="Start time"
                  type="time"
                  value={value.rangeStartTime}
                  disabled={disabled}
                  onChange={(event) => onChange({ ...value, rangeStartTime: event.target.value })}
                />
              </div>
              <div className="space-y-3">
                <CalendarDatePicker
                  id={`${id}-range-end-date`}
                  label="End date"
                  value={value.rangeEndDate}
                  min={value.rangeStartDate || undefined}
                  disabled={disabled}
                  onChange={(nextDate) => onChange({ ...value, rangeEndDate: nextDate })}
                />
                <Input
                  id={`${id}-range-end-time`}
                  label="End time"
                  type="time"
                  value={value.rangeEndTime}
                  disabled={disabled}
                  onChange={(event) => onChange({ ...value, rangeEndTime: event.target.value })}
                />
              </div>
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
