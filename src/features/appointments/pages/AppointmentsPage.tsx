import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import type { AppointmentView } from '@/lib/api/appointments-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import CancelAppointmentDialog from '../components/CancelAppointmentDialog';
import RescheduleAppointmentDialog from '../components/RescheduleAppointmentDialog';
import { getApiErrorMessage, resolvePatientId, type BookingMode, useAppointmentList, useCancelAppointment, useRescheduleAppointment } from '../hooks/useAppointments';
import { isPastAppointment } from '../components/appointmentFormat';

interface AppointmentsPageProps {
  mode: BookingMode;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
      {label}
    </div>
  );
}

export default function AppointmentsPage({ mode }: AppointmentsPageProps) {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = mode === 'patient' ? resolvePatientId(user) : undefined;
  const root = mode === 'patient' ? '/patient' : '/receptionist';
  const label = mode === 'patient' ? 'Patient' : 'Receptionist';
  const [detailAppointment, setDetailAppointment] = useState<AppointmentView | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<AppointmentView | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<AppointmentView | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState('');

  const params = useMemo(
    () => ({
      page: 1,
      limit: 50,
      patientId,
    }),
    [patientId]
  );
  const appointmentsQuery = useAppointmentList(params, mode === 'receptionist' || Boolean(patientId));
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();
  const appointments = appointmentsQuery.data?.items ?? [];
  const upcoming = appointments.filter((appointment) => !isPastAppointment(appointment));
  const past = appointments.filter(isPastAppointment).reverse();

  const closeCancel = () => {
    setCancelAppointment(null);
    setCancelReason('');
    setActionError('');
  };

  const closeReschedule = () => {
    setRescheduleAppointment(null);
    setActionError('');
  };

  const confirmCancel = async () => {
    if (!cancelAppointment || !cancelReason.trim()) return;
    setActionError('');

    try {
      await cancelMutation.mutateAsync({ id: cancelAppointment.id, reason: cancelReason });
      closeCancel();
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Appointment could not be cancelled'));
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Appointments' }]} />

      <Card
        title={mode === 'patient' ? 'My Appointments' : 'Appointments'}
        subtitle={mode === 'patient' ? 'Upcoming and past appointment history' : 'Facility appointment list'}
        actions={
          <Link to={`${root}/book-appointment`}>
            <Button type="button">Book Appointment</Button>
          </Link>
        }
      >
        <div className="space-y-5">
          {mode === 'patient' && !patientId ? (
            <FeedbackMessage type="error" message="Patient profile could not be resolved from your session" />
          ) : null}

          {appointmentsQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading appointments...</div>
          ) : null}

          {appointmentsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getApiErrorMessage(appointmentsQuery.error, 'Appointments could not be loaded')}
            />
          ) : null}

          {!appointmentsQuery.isLoading && !appointmentsQuery.isError ? (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Upcoming</h2>
                {upcoming.length === 0 ? (
                  <EmptyState label="No upcoming appointments." />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {upcoming.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={(nextAppointment) => {
                          setCancelAppointment(nextAppointment);
                          setActionError('');
                        }}
                        onDetail={setDetailAppointment}
                        onReschedule={(nextAppointment) => {
                          setRescheduleAppointment(nextAppointment);
                          setActionError('');
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold text-foreground">Past</h2>
                {past.length === 0 ? (
                  <EmptyState label="No past appointments." />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {past.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={(nextAppointment) => {
                          setCancelAppointment(nextAppointment);
                          setActionError('');
                        }}
                        onDetail={setDetailAppointment}
                        onReschedule={(nextAppointment) => {
                          setRescheduleAppointment(nextAppointment);
                          setActionError('');
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </Card>

      <AppointmentDetailModal appointment={detailAppointment} onClose={() => setDetailAppointment(null)} />
      <CancelAppointmentDialog
        appointment={cancelAppointment}
        reason={cancelReason}
        loading={cancelMutation.isPending}
        error={actionError}
        onReasonChange={setCancelReason}
        onClose={closeCancel}
        onConfirm={confirmCancel}
      />
      <RescheduleAppointmentDialog
        appointment={rescheduleAppointment}
        loading={rescheduleMutation.isPending}
        error={actionError}
        onClose={closeReschedule}
        onConfirm={async (slot) => {
          if (!rescheduleAppointment) return;
          setActionError('');

          try {
            await rescheduleMutation.mutateAsync({
              id: rescheduleAppointment.id,
              payload: { scheduledAt: slot.start },
            });
            closeReschedule();
          } catch (error) {
            setActionError(getApiErrorMessage(error, 'Appointment could not be rescheduled'));
          }
        }}
      />
    </div>
  );
}
