import { useMemo } from 'react';
import { CalendarPlus, ClipboardList, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppointmentStatusBadge from '@/features/appointments/components/AppointmentStatusBadge';
import { formatAppointmentDate } from '@/features/appointments/components/appointmentFormat';
import { useAppointmentList } from '@/features/appointments/hooks/useAppointments';
import { useResolvedPatientSession } from '@/features/auth/hooks/useResolvedPatientSession';
import { useChatUnreadCount } from '@/features/chat/useChat';
import PatientFeedbackPrompt from '@/features/feedback/components/PatientFeedbackPrompt';
import { usePendingFeedbackAppointments } from '@/features/feedback/hooks/useFeedback';
import { useUnreadNotificationCount } from '@/features/notifications/useNotifications';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'info' | 'success' | 'warning' }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <Badge variant={tone}>{tone}</Badge>
      </div>
    </Card>
  );
}

export default function PatientDashboardPage() {
  const patientSession = useResolvedPatientSession();
  const patientId = patientSession.patientId;
  const waitingForPatient = patientSession.isResolving && !patientId;
  const upcomingParams = useMemo(
    () => ({ page: 1, limit: 3, patientId, from: new Date().toISOString() }),
    [patientId]
  );
  const upcomingQuery = useAppointmentList(upcomingParams, Boolean(patientId));
  const pendingFeedbackQuery = usePendingFeedbackAppointments(3, patientId, Boolean(patientId));
  const notificationsQuery = useUnreadNotificationCount();
  const messagesQuery = useChatUnreadCount();
  const upcomingAppointments = upcomingQuery.data?.items ?? [];
  const pendingFeedbackCount = pendingFeedbackQuery.data?.meta.total ?? pendingFeedbackQuery.data?.items.length ?? 0;

  return (
    <div className="space-y-6">
      <PatientFeedbackPrompt patientId={patientId} enabled={Boolean(patientId)} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Upcoming Appointments"
          value={waitingForPatient || upcomingQuery.isLoading ? '-' : String(upcomingAppointments.length)}
          tone="info"
        />
        <MetricCard
          label="Unread Notifications"
          value={notificationsQuery.isLoading ? '-' : String(notificationsQuery.data ?? 0)}
          tone="warning"
        />
        <MetricCard
          label="Unread Messages"
          value={messagesQuery.isLoading ? '-' : String(messagesQuery.data ?? 0)}
          tone="warning"
        />
        <MetricCard
          label="Feedback Prompts"
          value={pendingFeedbackQuery.isLoading ? '-' : String(pendingFeedbackCount)}
          tone="success"
        />
      </section>

      <Card title="Quick Actions" subtitle="Start the common patient tasks from one place">
        <div className="flex flex-wrap gap-3">
          <Link to="/patient/book-appointment">
            <Button type="button" leftIcon={<CalendarPlus className="h-4 w-4" />}>
              Book Appointment
            </Button>
          </Link>
          <Link to="/patient/medical-records">
            <Button type="button" variant="secondary" leftIcon={<ClipboardList className="h-4 w-4" />}>
              View Records
            </Button>
          </Link>
          <Link to="/patient/messages">
            <Button type="button" variant="secondary" leftIcon={<MessageSquare className="h-4 w-4" />}>
              Chat with Doctor
            </Button>
          </Link>
        </div>
      </Card>

      <Card title="Upcoming Appointments" subtitle="Your next scheduled visits">
        <div className="space-y-3">
          {waitingForPatient || upcomingQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading appointments...</div>
          ) : null}
          {upcomingQuery.isError ? (
            <FeedbackMessage type="error" message="Upcoming appointments could not be loaded" />
          ) : null}
          {!waitingForPatient && Boolean(patientId) && !upcomingQuery.isLoading && !upcomingQuery.isError && upcomingAppointments.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm text-muted">
              No upcoming appointments.
            </div>
          ) : null}
          {upcomingAppointments.map((appointment) => (
            <article key={appointment.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium text-foreground">{appointment.service.name}</h2>
                  <p className="mt-1 text-sm text-muted">{formatAppointmentDate(appointment.scheduledAt)}</p>
                  <p className="mt-1 text-sm text-muted">{appointment.staff?.displayName ?? appointment.department.name}</p>
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
