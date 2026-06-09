import type { AvailableSlot } from '@/lib/api/appointments-api';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface SlotPickerProps {
  slots: AvailableSlot[];
  occupiedSlots?: AvailableSlot[];
  selectedStart?: string;
  loading: boolean;
  error?: string;
  emptyMessage?: string;
  onSelect: (slot: AvailableSlot) => void;
}

type DisplaySlot = AvailableSlot & { status: 'available' | 'occupied' };

function formatSlotDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function groupSlots(slots: DisplaySlot[]) {
  return slots.reduce<Record<string, DisplaySlot[]>>((groups, slot) => {
    const date = slot.start.slice(0, 10);
    groups[date] = [...(groups[date] ?? []), slot];
    return groups;
  }, {});
}

export default function SlotPicker({
  slots,
  occupiedSlots = [],
  selectedStart,
  loading,
  error,
  emptyMessage = 'No slots are available in the next three weeks.',
  onSelect,
}: SlotPickerProps) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading available slots...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  const displaySlots = [
    ...slots.map((slot): DisplaySlot => ({ ...slot, status: 'available' })),
    ...occupiedSlots.map((slot): DisplaySlot => ({ ...slot, status: 'occupied' })),
  ].sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());
  const groupedSlots = groupSlots(displaySlots);
  const dates = Object.keys(groupedSlots).sort();

  if (displaySlots.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="max-h-[34rem] space-y-4 overflow-y-auto pr-1">
      {dates.map((slotDate) => (
        <section key={slotDate} className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{formatSlotDate(`${slotDate}T00:00:00`)}</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {groupedSlots[slotDate].map((slot) => {
              const isSelected = selectedStart === slot.start;
              const isOccupied = slot.status === 'occupied';

              return (
                <button
                  key={`${slot.status}-${slot.start}`}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => onSelect(slot)}
                  className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isOccupied
                        ? 'cursor-not-allowed border-danger/30 bg-danger/10 text-danger'
                        : 'border-border bg-background hover:border-primary'
                  }`}
                >
                  <span>{slot.startTime}</span>
                  {isOccupied ? <span className="block text-[11px] font-semibold">Booked</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
