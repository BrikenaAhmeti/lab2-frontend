import { Link } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import { usePendingFeedbackAppointments } from '../hooks/useFeedback';
import { formatFeedbackDate } from './feedbackFormat';

export default function PatientFeedbackPrompt() {
  const appointmentsQuery = usePendingFeedbackAppointments(3);
  const appointments = appointmentsQuery.data?.items ?? [];
  const firstAppointment = appointments[0];

  if (appointmentsQuery.isLoading || appointmentsQuery.isError || !firstAppointment) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Share appointment feedback</h2>
          <p className="mt-1 text-sm text-muted">
            {`${firstAppointment.service.name} on ${formatFeedbackDate(firstAppointment.completedAt ?? firstAppointment.scheduledAt)}`}
          </p>
        </div>
        <Link to={`/patient/feedback?appointmentId=${firstAppointment.id}`}>
          <Button size="sm">Leave Feedback</Button>
        </Link>
      </div>
    </Card>
  );
}
