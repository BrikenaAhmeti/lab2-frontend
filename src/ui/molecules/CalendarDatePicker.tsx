import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface CalendarDatePickerProps {
  id: string;
  label: string;
  value: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  onChange: (value: string) => void;
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2026, index, 1)),
}));

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue) - 1;
  const day = Number(dayValue);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function todayInputValue() {
  return formatDateInput(new Date());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function clampMonth(date: Date, min?: string, max?: string) {
  const minDate = min ? parseDateInput(min) : null;
  const maxDate = max ? parseDateInput(max) : null;
  const monthStart = startOfMonth(date);

  if (minDate && monthStart < startOfMonth(minDate)) return startOfMonth(minDate);
  if (maxDate && monthStart > startOfMonth(maxDate)) return startOfMonth(maxDate);

  return monthStart;
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = Array.from({ length: firstDay }, () => null);
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
  const cells = [...leadingDays, ...monthDays];

  return [...cells, ...Array.from({ length: Math.max(42 - cells.length, 0) }, () => null)];
}

function formatReadableDate(value: string) {
  const parsed = parseDateInput(value);
  if (!parsed) return '';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function formatAriaDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function isOutsideRange(value: string, min?: string, max?: string) {
  return Boolean((min && value < min) || (max && value > max));
}

function getYearOptions(min?: string, max?: string, visibleYear?: number) {
  const currentYear = new Date().getFullYear();
  const minYear = parseDateInput(min ?? '')?.getFullYear() ?? Math.min(visibleYear ?? currentYear, currentYear) - 10;
  const maxYear = parseDateInput(max ?? '')?.getFullYear() ?? Math.max(visibleYear ?? currentYear, currentYear) + 10;

  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

export default function CalendarDatePicker({
  id,
  label,
  value,
  className,
  disabled,
  error,
  helperText,
  min,
  max,
  placeholder = 'YYYY-MM-DD',
  required,
  autoComplete,
  onChange,
}: CalendarDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseDateInput(value);
  const [visibleMonth, setVisibleMonth] = useState(() => clampMonth(startOfMonth(selectedDate ?? new Date()), min, max));
  const labelId = `${id}-label`;
  const panelId = `${id}-calendar`;
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const readableValue = formatReadableDate(value);
  const yearOptions = useMemo(() => getYearOptions(min, max, visibleMonth.getFullYear()), [min, max, visibleMonth]);

  useEffect(() => {
    const nextSelectedDate = parseDateInput(value);
    if (nextSelectedDate) {
      setVisibleMonth(clampMonth(startOfMonth(nextSelectedDate), min, max));
    }
  }, [max, min, value]);

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

  const changeMonth = (delta: number) => {
    setVisibleMonth((current) => clampMonth(new Date(current.getFullYear(), current.getMonth() + delta, 1), min, max));
  };

  const selectDate = (date: Date) => {
    const nextValue = formatDateInput(date);
    if (disabled || isOutsideRange(nextValue, min, max)) return;
    onChange(nextValue);
    setOpen(false);
  };

  const changeVisibleMonth = (month: number) => {
    setVisibleMonth((current) => clampMonth(new Date(current.getFullYear(), month, 1), min, max));
  };

  const changeVisibleYear = (year: number) => {
    setVisibleMonth((current) => clampMonth(new Date(year, current.getMonth(), 1), min, max));
  };

  const clearDate = () => {
    onChange('');
    setOpen(false);
  };

  const selectToday = () => {
    const today = todayInputValue();
    if (!isOutsideRange(today, min, max)) {
      onChange(today);
      setVisibleMonth(startOfMonth(new Date()));
      setOpen(false);
    }
  };

  return (
    <div className={clsx('relative space-y-1.5', className)} ref={containerRef}>
      <label id={labelId} htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-controls={panelId}
          aria-expanded={open}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => onChange(event.target.value)}
          className={clsx(
            'w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-20 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-danger focus:border-danger focus:ring-danger/20'
          )}
        />

        {value ? (
          <button
            type="button"
            className="absolute right-11 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={disabled}
            onClick={clearDate}
            aria-label="Clear date"
            aria-describedby={labelId}
            title="Clear date"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}

        <button
          type="button"
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          aria-label="Open calendar"
          aria-describedby={labelId}
          title="Open calendar"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : readableValue || helperText ? (
        <p className="text-xs text-muted">{readableValue || helperText}</p>
      ) : null}

      {open ? (
        <section
          id={panelId}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-panel"
          role="dialog"
          aria-labelledby={labelId}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
              aria-describedby={labelId}
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_6rem] gap-2">
              <label className="sr-only" htmlFor={`${id}-month`}>
                Month
              </label>
              <select
                id={`${id}-month`}
                value={visibleMonth.getMonth()}
                disabled={disabled}
                onChange={(event) => changeVisibleMonth(Number(event.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor={`${id}-year`}>
                Year
              </label>
              <select
                id={`${id}-year`}
                value={visibleMonth.getFullYear()}
                disabled={disabled}
                onChange={(event) => changeVisibleYear(Number(event.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-2 text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              onClick={() => changeMonth(1)}
              aria-label="Next month"
              aria-describedby={labelId}
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted">
            {weekdays.map((weekday) => (
              <span key={weekday} className="py-1">
                {weekday}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((calendarDate, index) => {
              if (!calendarDate) return <span key={`empty-${index}`} className="h-8" aria-hidden="true" />;

              const dateValue = formatDateInput(calendarDate);
              const isSelected = dateValue === value;
              const isToday = dateValue === todayInputValue();
              const isUnavailable = disabled || isOutsideRange(dateValue, min, max);
              const ariaDate = formatAriaDate(calendarDate);

              return (
                <button
                  key={dateValue}
                  type="button"
                  className={clsx(
                    'grid h-8 place-items-center rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/20',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                      : 'border-transparent bg-background text-foreground hover:border-primary hover:text-primary',
                    isToday && !isSelected && 'bg-primary/8 text-primary',
                    isUnavailable && 'cursor-not-allowed opacity-40 hover:border-transparent hover:text-foreground'
                  )}
                  disabled={isUnavailable}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Selected ${ariaDate}` : `Choose ${ariaDate}`}
                  onClick={() => selectDate(calendarDate)}
                >
                  {calendarDate.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled || !value}
              onClick={clearDate}
            >
              Clear
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted transition hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                disabled={disabled || isOutsideRange(todayInputValue(), min, max)}
                onClick={selectToday}
              >
                Today
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
