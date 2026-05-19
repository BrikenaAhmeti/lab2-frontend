import type { AvailableSlot } from '@/lib/api/appointments-api';
import SlotPicker from './SlotPicker';
import { getTodayInputValue } from './appointmentFormat';

interface SlotStepProps {
  date: string;
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  expiresInSeconds: number | null;
  loading: boolean;
  error?: string;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: AvailableSlot) => void;
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainder}`;
}

export default function SlotStep({
  date,
  slots,
  selectedSlot,
  expiresInSeconds,
  loading,
  error,
  onDateChange,
  onSlotSelect,
}: SlotStepProps) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Date</span>
        <input
          type="date"
          min={getTodayInputValue()}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
        />
      </label>

      <SlotPicker
        slots={slots}
        selectedStart={selectedSlot?.start}
        loading={loading}
        error={error}
        onSelect={onSlotSelect}
      />

      {selectedSlot && expiresInSeconds !== null ? (
        <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {`Selected ${selectedSlot.startTime}. Please confirm within ${formatCountdown(expiresInSeconds)}.`}
        </p>
      ) : null}
    </div>
  );
}
