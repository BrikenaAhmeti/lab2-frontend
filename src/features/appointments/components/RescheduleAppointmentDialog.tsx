import { useState } from 'react';
import Button from '@/ui/atoms/Button';
import type { AppointmentView, AvailableSlot } from '@/lib/api/appointments-api';
import { getApiErrorMessage, useAvailableSlots } from '../hooks/useAppointments';
import SlotPicker from './SlotPicker';
import { getTodayInputValue } from './appointmentFormat';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface RescheduleAppointmentDialogProps {
  appointment: AppointmentView | null;
  loading: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (slot: AvailableSlot) => void;
}

export default function RescheduleAppointmentDialog({
  appointment,
  loading,
  error,
  onClose,
  onConfirm,
}: RescheduleAppointmentDialogProps) {
  const [date, setDate] = useState(getTodayInputValue());
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const slotsQuery = useAvailableSlots(
    appointment?.staffProfileId ?? '',
    appointment?.serviceCatalogId ?? '',
    date,
    Boolean(appointment)
  );

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <section className="panel w-full max-w-2xl p-5">
        <h2 className="text-lg font-semibold text-foreground">Reschedule appointment</h2>
        <p className="mt-1 text-sm text-muted">{`${appointment.service.name} for ${appointment.patient.name}`}</p>

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Date</span>
          <input
            type="date"
            min={getTodayInputValue()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSlot(null);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-64"
          />
        </label>

        <div className="mt-4">
          <SlotPicker
            slots={slotsQuery.data?.slots ?? []}
            selectedStart={slot?.start}
            loading={slotsQuery.isLoading}
            error={slotsQuery.isError ? getApiErrorMessage(slotsQuery.error, 'Slots could not be loaded') : undefined}
            onSelect={setSlot}
          />
        </div>

        {error ? <FeedbackMessage type="error" message={error} className="mt-3" /> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" disabled={!slot} loading={loading} onClick={() => slot && onConfirm(slot)}>
            Save new time
          </Button>
        </div>
      </section>
    </div>
  );
}
