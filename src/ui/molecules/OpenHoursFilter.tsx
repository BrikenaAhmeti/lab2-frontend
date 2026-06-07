import clsx from 'clsx';
import { Clock, CalendarClock } from 'lucide-react';
import Input from '@/ui/atoms/Input';

export type OpenHoursFilterMode = 'single' | 'range';

export interface OpenHoursFilterValue {
  mode: OpenHoursFilterMode;
  singleDate: string;
  singleTime: string;
  rangeStartDate: string;
  rangeStartTime: string;
  rangeEndDate: string;
  rangeEndTime: string;
}

export interface OpenHoursFilterParams {
  openAt?: string;
  openFrom?: string;
  openTo?: string;
}

interface OpenHoursFilterProps {
  id: string;
  label: string;
  value: OpenHoursFilterValue;
  className?: string;
  disabled?: boolean;
  onChange: (value: OpenHoursFilterValue) => void;
}

export const emptyOpenHoursFilterValue: OpenHoursFilterValue = {
  mode: 'single',
  singleDate: '',
  singleTime: '',
  rangeStartDate: '',
  rangeStartTime: '',
  rangeEndDate: '',
  rangeEndTime: '',
};

function combineDateTime(date: string, time: string) {
  return date && time ? `${date}T${time}` : undefined;
}

function formatDateTime(date: string, time: string) {
  if (!date || !time) return '';

  const parsed = new Date(`${date}T${time}:00.000`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function openHoursFilterToParams(value: OpenHoursFilterValue): OpenHoursFilterParams {
  if (value.mode === 'single') {
    return {
      openAt: combineDateTime(value.singleDate, value.singleTime),
    };
  }

  return {
    openFrom: combineDateTime(value.rangeStartDate, value.rangeStartTime),
    openTo: combineDateTime(value.rangeEndDate, value.rangeEndTime),
  };
}

export function isOpenHoursFilterActive(value: OpenHoursFilterValue) {
  if (value.mode === 'single') {
    return Boolean(value.singleDate && value.singleTime);
  }

  return Boolean(value.rangeStartDate && value.rangeStartTime && value.rangeEndDate && value.rangeEndTime);
}

export function formatOpenHoursFilterSummary(value: OpenHoursFilterValue) {
  if (value.mode === 'single') {
    return formatDateTime(value.singleDate, value.singleTime);
  }

  const start = formatDateTime(value.rangeStartDate, value.rangeStartTime);
  const end = formatDateTime(value.rangeEndDate, value.rangeEndTime);

  return start && end ? `${start} - ${end}` : '';
}

export default function OpenHoursFilter({
  id,
  label,
  value,
  className,
  disabled,
  onChange,
}: OpenHoursFilterProps) {
  const selectMode = (mode: OpenHoursFilterMode) => {
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
      </div>

      {value.mode === 'single' ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id={`${id}-single-date`}
            label="Date"
            type="date"
            value={value.singleDate}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, singleDate: event.target.value })}
          />
          <Input
            id={`${id}-single-time`}
            label="Time"
            type="time"
            value={value.singleTime}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, singleTime: event.target.value })}
          />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-4">
          <Input
            id={`${id}-range-start-date`}
            label="Start date"
            type="date"
            value={value.rangeStartDate}
            max={value.rangeEndDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, rangeStartDate: event.target.value })}
          />
          <Input
            id={`${id}-range-start-time`}
            label="Start time"
            type="time"
            value={value.rangeStartTime}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, rangeStartTime: event.target.value })}
          />
          <Input
            id={`${id}-range-end-date`}
            label="End date"
            type="date"
            value={value.rangeEndDate}
            min={value.rangeStartDate || undefined}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, rangeEndDate: event.target.value })}
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
      )}
    </fieldset>
  );
}
