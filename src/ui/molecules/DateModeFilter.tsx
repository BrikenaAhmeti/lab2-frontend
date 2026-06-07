import clsx from 'clsx';
import { Calendar, CalendarRange } from 'lucide-react';
import Input from '@/ui/atoms/Input';

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
  disabled?: boolean;
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
  disabled,
  singleDateLabel = 'Date',
  rangeStartLabel = 'From',
  rangeEndLabel = 'To',
  onChange,
}: DateModeFilterProps) {
  const selectMode = (mode: DateModeFilterMode) => {
    onChange({ ...value, mode });
  };

  return (
    <fieldset className={clsx('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <legend className="text-sm font-medium text-foreground">{label}</legend>
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
      </div>

      {value.mode === 'single' ? (
        <Input
          id={`${id}-single-date`}
          label={singleDateLabel}
          type="date"
          value={value.singleDate}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, singleDate: event.target.value })}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id={`${id}-range-start-date`}
            label={rangeStartLabel}
            type="date"
            value={value.rangeStartDate}
            max={value.rangeEndDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, rangeStartDate: event.target.value })}
          />
          <Input
            id={`${id}-range-end-date`}
            label={rangeEndLabel}
            type="date"
            value={value.rangeEndDate}
            min={value.rangeStartDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, rangeEndDate: event.target.value })}
          />
        </div>
      )}
    </fieldset>
  );
}
