import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import { usePendingFeedbackAppointments } from '../hooks/useFeedback';
import { formatFeedbackDate } from './feedbackFormat';

export default function PatientFeedbackPrompt({ patientId, enabled = true }: { patientId?: string; enabled?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const appointmentsQuery = usePendingFeedbackAppointments(3, patientId, enabled);
  const appointments = appointmentsQuery.data?.items ?? [];
  const firstAppointment = appointments[0];

  if (dismissed || appointmentsQuery.isLoading || appointmentsQuery.isError || !firstAppointment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <Card className="w-full max-w-lg p-5">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Share appointment feedback</h2>
            <p className="mt-1 text-sm text-muted">
              {`${firstAppointment.service.name} on ${formatFeedbackDate(firstAppointment.completedAt ?? firstAppointment.scheduledAt)}`}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              Later
            </Button>
            <Link to={`/patient/feedback?appointmentId=${firstAppointment.id}`}>
              <Button size="sm">Leave Feedback</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
