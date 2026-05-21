import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import type { AppointmentView } from '@/lib/api/appointments-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import AppointmentStatusBadge from '@/features/appointments/components/AppointmentStatusBadge';
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  isFinalAppointment,
} from '@/features/appointments/components/appointmentFormat';
import {
  getApiErrorMessage,
  useTodayAppointments,
  useUpdateAppointmentStatus,
} from '@/features/appointments/hooks/useAppointments';
import PendingLabReviewsCard from '@/features/lab/components/PendingLabReviewsCard';
import { belongsToOrderingDoctor, isPendingLabReview, sortLabOrders } from '@/features/lab/components/labFormat';
import { useLabOrders } from '@/features/lab/hooks/useLabOrders';

function belongsToDoctor(appointment: AppointmentView, userId?: string, profileId?: string) {
  if (!userId && !profileId) return true;
  return appointment.staff?.userId === userId || appointment.staffProfileId === profileId;
}

function canOpenConsultation(appointment: AppointmentView) {
  return appointment.status === 'IN_PROGRESS';
}

function canStartConsultation(appointment: AppointmentView) {
  return appointment.status === 'CHECKED_IN';
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const todayQuery = useTodayAppointments();
  const labReviewsQuery = useLabOrders({ page: 1, limit: 100, status: 'completed' });
  const updateStatusMutation = useUpdateAppointmentStatus();
  const [actionError, setActionError] = useState('');
  const [activePanel, setActivePanel] = useState<'appointments' | 'lab-reviews'>('appointments');
  const appointments = useMemo(
    () => (todayQuery.data ?? []).filter((appointment) => belongsToDoctor(appointment, user?.id, user?.profileId)),
    [todayQuery.data, user?.id, user?.profileId]
  );
  const pendingLabReviews = useMemo(
    () =>
      sortLabOrders(
        (labReviewsQuery.data?.items ?? []).filter(
          (order) => isPendingLabReview(order) && belongsToOrderingDoctor(order, user?.id, user?.profileId)
        )
      ),
    [labReviewsQuery.data?.items, user?.id, user?.profileId]
  );
  const readyCount = appointments.filter(canStartConsultation).length;
  const unreadMessagesCount = 0;

  const startConsultation = async (appointment: AppointmentView) => {
    setActionError('');

    if (canOpenConsultation(appointment)) {
      navigate(`/doctor/consultations/${appointment.id}`);
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({ id: appointment.id, payload: { action: 'start' } });
      navigate(`/doctor/consultations/${appointment.id}`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Consultation could not be started'));
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Doctor', to: '/doctor' }, { label: 'Dashboard' }]} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Today</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{appointments.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Ready</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{readyCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Pending Lab Reviews</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{pendingLabReviews.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Unread Messages</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{unreadMessagesCount}</p>
        </Card>
      </div>

      {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activePanel === 'appointments' ? 'primary' : 'secondary'}
          onClick={() => setActivePanel('appointments')}
        >
          Today's Appointments
        </Button>
        <Button
          type="button"
          variant={activePanel === 'lab-reviews' ? 'primary' : 'secondary'}
          onClick={() => setActivePanel('lab-reviews')}
        >
          Pending Reviews
        </Button>
      </div>

      {activePanel === 'appointments' ? (
        <Card title="Today's Appointments" subtitle="Sorted by time">
          {todayQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading schedule...</div>
          ) : null}

          {todayQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getApiErrorMessage(todayQuery.error, "Today's appointments could not be loaded")}
            />
          ) : null}

          {!todayQuery.isLoading && !todayQuery.isError && appointments.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              No appointments today.
            </div>
          ) : null}

          <ol className="space-y-3">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AppointmentStatusBadge status={appointment.status} />
                      <Badge>{appointment.appointmentType.replaceAll('_', ' ')}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{appointment.patient.name}</p>
                      <p className="mt-1 text-sm text-muted">
                        {`${appointment.service.name} - ${appointment.department.name}`}
                      </p>
                      <p className="mt-1 text-sm text-muted">{formatAppointmentDate(appointment.scheduledAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-medium text-foreground">{formatAppointmentTimeRange(appointment)}</p>
                    {canOpenConsultation(appointment) ? (
                      <Link to={`/doctor/consultations/${appointment.id}`}>
                        <Button type="button" size="sm">
                          Open Consultation
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!canStartConsultation(appointment) || isFinalAppointment(appointment.status)}
                        loading={updateStatusMutation.isPending}
                        onClick={() => startConsultation(appointment)}
                      >
                        Start Consultation
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      ) : (
        <PendingLabReviewsCard
          orders={pendingLabReviews}
          loading={labReviewsQuery.isLoading}
          error={labReviewsQuery.isError}
        />
      )}
    </div>
  );
}
