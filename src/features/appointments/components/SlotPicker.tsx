import type { AvailableSlot } from '@/lib/api/appointments-api';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface SlotPickerProps {
  slots: AvailableSlot[];
  selectedStart?: string;
  loading: boolean;
  error?: string;
  emptyMessage?: string;
  onSelect: (slot: AvailableSlot) => void;
}

export default function SlotPicker({
  slots,
  selectedStart,
  loading,
  error,
  emptyMessage = 'No available slots for this date.',
  onSelect,
}: SlotPickerProps) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading available slots...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {slots.map((slot) => (
        <button
          key={slot.start}
          type="button"
          onClick={() => onSelect(slot)}
          className={`rounded-xl border px-3 py-2 text-sm font-medium transition hover:border-primary ${
            selectedStart === slot.start ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
          }`}
        >
          {slot.startTime}
        </button>
      ))}
    </div>
  );
}
