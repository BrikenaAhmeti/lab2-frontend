import { useState } from 'react';
import Button from '@/ui/atoms/Button';
import Badge from '@/ui/atoms/Badge';
import Input from '@/ui/atoms/Input';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  getApiErrorMessage,
  useCreateStaffException,
  useDeleteStaffException,
  useStaffExceptions,
} from '@/features/staff/hooks/useStaff';

export default function StaffExceptionsPanel({ staffId }: { staffId: string }) {
  const exceptionsQuery = useStaffExceptions(staffId);
  const createMutation = useCreateStaffException(staffId);
  const deleteMutation = useDeleteStaffException(staffId);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');

  const addException = async () => {
    setError('');

    if (!date) {
      setError('Date is required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        date,
        reason: reason || null,
        isWorking,
        startTime: null,
        endTime: null,
      });
      setDate('');
      setReason('');
      setIsWorking(false);
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError, 'Exception could not be saved'));
    }
  };

  const removeException = async (id: string) => {
    setError('');

    try {
      await deleteMutation.mutateAsync(id);
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError, 'Exception could not be deleted'));
    }
  };

  if (exceptionsQuery.isLoading) {
    return <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted shadow-panel">Loading exceptions...</div>;
  }

  if (exceptionsQuery.isError) {
    return <FeedbackMessage type="error" message={getApiErrorMessage(exceptionsQuery.error, 'Exceptions could not be loaded')} />;
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-panel">
      <h3 className="text-base font-semibold text-foreground">Schedule exceptions</h3>
      {error ? <FeedbackMessage type="error" message={error} /> : null}

      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto_auto]">
        <CalendarDatePicker id="staff-exception-date" label="Date" value={date} onChange={setDate} />
        <Input id="staff-exception-reason" label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        <label htmlFor="staff-exception-working" className="flex items-end gap-2 pb-3 text-sm font-medium text-foreground">
          <input
            id="staff-exception-working"
            type="checkbox"
            checked={isWorking}
            onChange={(event) => setIsWorking(event.target.checked)}
            className="h-4 w-4 rounded border-border text-primary"
          />
          Working
        </label>
        <Button type="button" className="self-end" loading={createMutation.isPending} onClick={addException}>Add</Button>
      </div>

      <div className="space-y-2">
        {exceptionsQuery.data?.length ? (
          exceptionsQuery.data.map((exception) => (
            <div key={exception.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div>
                <p className="font-medium text-foreground">{exception.date}</p>
                <p className="text-sm text-muted">{exception.reason || 'No reason added'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={exception.isWorking ? 'info' : 'warning'}>{exception.isWorking ? 'Special hours' : 'Day off'}</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  loading={deleteMutation.isPending}
                  onClick={() => removeException(exception.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-border bg-surface/60 px-4 py-6 text-center text-sm text-muted">
            No schedule exceptions found.
          </p>
        )}
      </div>
    </section>
  );
}
