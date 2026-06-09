import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AvailableSlot } from '@/lib/api/appointments-api';
import SlotPicker from './SlotPicker';
import { isWeekendDateInput } from './appointmentFormat';

interface SlotStepProps {
  date: string;
  slots: AvailableSlot[];
  occupiedSlots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  expiresInSeconds: number | null;
  loading: boolean;
  error?: string;
  minDate: string;
  maxDate: string;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: AvailableSlot) => void;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainder}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function clampToBookableDate(value: string, minDate: string, maxDate: string) {
  let nextValue = value;

  if (nextValue < minDate) nextValue = minDate;
  if (nextValue > maxDate) nextValue = maxDate;

  const nextDate = parseDateInput(nextValue);

  while (formatDateInput(nextDate) <= maxDate && isWeekendDateInput(formatDateInput(nextDate))) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  if (formatDateInput(nextDate) <= maxDate) {
    return formatDateInput(nextDate);
  }

  const previousDate = parseDateInput(nextValue);

  while (formatDateInput(previousDate) >= minDate && isWeekendDateInput(formatDateInput(previousDate))) {
    previousDate.setDate(previousDate.getDate() - 1);
  }

  return formatDateInput(previousDate) >= minDate ? formatDateInput(previousDate) : minDate;
}

export default function SlotStep({
  date,
  slots,
  occupiedSlots,
  selectedSlot,
  expiresInSeconds,
  loading,
  error,
  minDate,
  maxDate,
  onDateChange,
  onSlotSelect,
}: SlotStepProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const parsedDate = parseDateInput(date);
    return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
  });
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(parseDateInput(minDate)) +
      ' - ' +
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(parseDateInput(maxDate)),
    [maxDate, minDate]
  );
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
      }).format(visibleMonth),
    [visibleMonth]
  );

  const selectDate = (nextDate: Date) => {
    const nextValue = formatDateInput(nextDate);
    if (nextValue < minDate || nextValue > maxDate || isWeekendDateInput(nextValue)) return;
    onDateChange(nextValue);
  };

  const changeMonth = (delta: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const handleDateInput = (nextValue: string) => {
    const bookableDate = clampToBookableDate(nextValue, minDate, maxDate);
    onDateChange(bookableDate);
    const parsedDate = parseDateInput(bookableDate);
    setVisibleMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
      <section className="rounded-xl border border-border bg-surface/50 p-4" aria-labelledby="booking-calendar-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 id="booking-calendar-title" className="font-semibold text-foreground">
                {monthLabel}
              </h3>
              <p className="text-sm text-muted">{selectedDateLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-muted transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-background text-muted transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {weekdays.map((weekday) => (
            <span key={weekday} className="py-1">
              {weekday}
            </span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {calendarDays.map((calendarDate, index) => {
            if (!calendarDate) return <span key={`empty-${index}`} className="aspect-square" />;

            const value = formatDateInput(calendarDate);
            const isSelected = value === date;
            const isDisabled = value < minDate || value > maxDate || isWeekendDateInput(value);

            return (
              <button
                key={value}
                type="button"
                disabled={isDisabled}
                aria-pressed={isSelected}
                onClick={() => selectDate(calendarDate)}
                className={`aspect-square rounded-xl border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-transparent bg-background text-foreground hover:border-primary'
                } ${isDisabled ? 'cursor-not-allowed opacity-40 hover:border-transparent' : ''}`}
              >
                {calendarDate.getDate()}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Date</span>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(event) => handleDateInput(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
          />
        </label>
      </section>

      <section className="rounded-xl border border-border bg-background p-4" aria-labelledby="available-times-title">
        <div className="mb-4">
          <h3 id="available-times-title" className="font-semibold text-foreground">
            Available times for the next 3 weeks
          </h3>
          <p className="text-sm text-muted">{selectedDateLabel}</p>
        </div>

        <SlotPicker
          slots={slots}
          occupiedSlots={occupiedSlots}
          selectedStart={selectedSlot?.start}
          loading={loading}
          error={error}
          onSelect={onSlotSelect}
        />

        {selectedSlot && expiresInSeconds !== null ? (
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
            {`Selected ${selectedSlot.startTime}. Please confirm within ${formatCountdown(expiresInSeconds)}.`}
          </p>
        ) : null}
      </section>
    </div>
  );
}
