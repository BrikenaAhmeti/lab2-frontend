import { useEffect, useState } from 'react';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { getApiErrorMessage, useSaveStaffSchedules, useStaffSchedules } from '@/features/staff/hooks/useStaff';
import type { StaffSchedule } from '@/lib/api/staff-api';

const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultSchedules: StaffSchedule[] = dayLabels.map((_, dayOfWeek) => ({
  dayOfWeek,
  isWorking: dayOfWeek > 0 && dayOfWeek < 6,
  startTime: '09:00',
  endTime: '17:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
}));

export default function StaffSchedulePanel({ staffId }: { staffId: string }) {
  const schedulesQuery = useStaffSchedules(staffId);
  const saveMutation = useSaveStaffSchedules(staffId);
  const [schedules, setSchedules] = useState(defaultSchedules);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (schedulesQuery.data?.length) {
      setSchedules(
        defaultSchedules.map((defaultDay) => ({
          ...defaultDay,
          ...schedulesQuery.data.find((schedule) => schedule.dayOfWeek === defaultDay.dayOfWeek),
        }))
      );
    }
  }, [schedulesQuery.data]);

  const updateSchedule = (dayOfWeek: number, values: Partial<StaffSchedule>) => {
    setSchedules((current) =>
      current.map((schedule) => (schedule.dayOfWeek === dayOfWeek ? { ...schedule, ...values } : schedule))
    );
  };

  const saveSchedules = async () => {
    setMessage(null);

    try {
      await saveMutation.mutateAsync(schedules);
      setMessage({ type: 'success', text: 'Schedule saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: getApiErrorMessage(error, 'Schedule could not be saved') });
    }
  };

  if (schedulesQuery.isLoading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading schedule...</div>;
  }

  if (schedulesQuery.isError) {
    return <FeedbackMessage type="error" message={getApiErrorMessage(schedulesQuery.error, 'Schedule could not be loaded')} />;
  }

  return (
    <section className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">Weekly schedule</h3>
        <Button type="button" loading={saveMutation.isPending} onClick={saveSchedules}>Save schedule</Button>
      </div>
      {message ? <FeedbackMessage type={message.type} message={message.text} /> : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Working</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">End</th>
              <th className="px-4 py-3 font-medium">Break</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.dayOfWeek} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{dayLabels[schedule.dayOfWeek]}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={schedule.isWorking}
                    onChange={(event) => updateSchedule(schedule.dayOfWeek, { isWorking: event.target.checked })}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={schedule.startTime}
                    disabled={!schedule.isWorking}
                    onChange={(event) => updateSchedule(schedule.dayOfWeek, { startTime: event.target.value })}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={schedule.endTime}
                    disabled={!schedule.isWorking}
                    onChange={(event) => updateSchedule(schedule.dayOfWeek, { endTime: event.target.value })}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="time"
                      value={schedule.breakStartTime ?? ''}
                      disabled={!schedule.isWorking}
                      onChange={(event) => updateSchedule(schedule.dayOfWeek, { breakStartTime: event.target.value || null })}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                    <input
                      type="time"
                      value={schedule.breakEndTime ?? ''}
                      disabled={!schedule.isWorking}
                      onChange={(event) => updateSchedule(schedule.dayOfWeek, { breakEndTime: event.target.value || null })}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
