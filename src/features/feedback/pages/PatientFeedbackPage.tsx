import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AppointmentView } from '@/lib/api/appointments-api';
import { buildSubmitFeedbackPayload } from '@/lib/api/feedback-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import FeedbackHistoryList from '../components/FeedbackHistoryList';
import { formatFeedbackDate } from '../components/feedbackFormat';
import {
  getFeedbackApiErrorMessage,
  useMyFeedback,
  usePendingFeedbackAppointments,
  useSubmitFeedback,
} from '../hooks/useFeedback';

function appointmentLabel(appointment: AppointmentView) {
  return `${appointment.service.name} · ${formatFeedbackDate(appointment.completedAt ?? appointment.scheduledAt)}`;
}

export default function PatientFeedbackPage() {
  const [searchParams] = useSearchParams();
  const requestedAppointmentId = searchParams.get('appointmentId') ?? '';
  const appointmentsQuery = usePendingFeedbackAppointments(20);
  const historyQuery = useMyFeedback({ page: 1, limit: 10 });
  const submitMutation = useSubmitFeedback();
  const appointments = useMemo(() => appointmentsQuery.data?.items ?? [], [appointmentsQuery.data]);
  const [appointmentId, setAppointmentId] = useState(requestedAppointmentId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (appointments.length === 0) {
      setAppointmentId('');
      return;
    }

    if (requestedAppointmentId && appointments.some((appointment) => appointment.id === requestedAppointmentId)) {
      setAppointmentId(requestedAppointmentId);
      return;
    }

    if (!appointmentId || !appointments.some((appointment) => appointment.id === appointmentId)) {
      setAppointmentId(appointments[0].id);
    }
  }, [appointmentId, appointments, requestedAppointmentId]);

  const selectedAppointment = appointments.find((appointment) => appointment.id === appointmentId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!appointmentId) {
      setFeedback({ type: 'error', message: 'Choose a completed appointment first.' });
      return;
    }

    try {
      await submitMutation.mutateAsync(buildSubmitFeedbackPayload({ appointmentId, rating, comment, isAnonymous }));
      setRating(5);
      setComment('');
      setIsAnonymous(false);
      setFeedback({ type: 'success', message: 'Feedback submitted. Thank you for sharing it.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getFeedbackApiErrorMessage(error, 'Feedback could not be submitted.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Feedback' }]} />

      <Card title="Appointment Feedback" subtitle="Rate completed appointments that have not received feedback yet">
        <div className="space-y-4">
          {appointmentsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getFeedbackApiErrorMessage(appointmentsQuery.error, 'Completed appointments could not be loaded.')}
            />
          ) : null}

          {appointmentsQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading completed appointments...</div>
          ) : null}

          {!appointmentsQuery.isLoading && !appointmentsQuery.isError && appointments.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              No completed appointments are waiting for feedback.
            </p>
          ) : null}

          {appointments.length > 0 ? (
            <form className="space-y-4" onSubmit={submit}>
              <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-foreground">Appointment</span>
                  <select
                    value={appointmentId}
                    onChange={(event) => setAppointmentId(event.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                  >
                    {appointments.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {appointmentLabel(appointment)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-foreground">Rating</span>
                  <select
                    value={rating}
                    onChange={(event) => setRating(Number(event.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {selectedAppointment ? (
                <p className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm text-muted">
                  {`${selectedAppointment.department.name} · ${selectedAppointment.staff?.displayName ?? 'Staff member'}`}
                </p>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Comment</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(event) => setIsAnonymous(event.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Submit anonymously
              </label>

              {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

              <Button type="submit" loading={submitMutation.isPending}>Submit Feedback</Button>
            </form>
          ) : null}
        </div>
      </Card>

      <Card title="Submitted Feedback" subtitle="Your recent feedback history">
        <div className="space-y-4">
          {historyQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading feedback history...</div>
          ) : null}
          {historyQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getFeedbackApiErrorMessage(historyQuery.error, 'Feedback history could not be loaded.')}
            />
          ) : null}
          {!historyQuery.isLoading && !historyQuery.isError ? (
            <FeedbackHistoryList items={historyQuery.data?.items ?? []} />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
