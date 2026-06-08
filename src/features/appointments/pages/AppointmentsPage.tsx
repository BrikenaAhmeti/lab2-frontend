import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, PhoneCall } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import ExportButton from '@/components/export/ExportButton';
import { useResolvedPatientSession } from '@/features/auth/hooks/useResolvedPatientSession';
import type { AppointmentView } from '@/lib/api/appointments-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import CancelAppointmentDialog from '../components/CancelAppointmentDialog';
import RescheduleAppointmentDialog from '../components/RescheduleAppointmentDialog';
import { getApiErrorMessage, useAppointmentList, useCancelAppointment, useRescheduleAppointment } from '../hooks/useAppointments';
import { isPastAppointment } from '../components/appointmentFormat';

type AppointmentsPageMode = 'patient' | 'receptionist' | 'nurse';

interface AppointmentsPageProps {
  mode: AppointmentsPageMode;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
      {label}
    </div>
  );
}

export default function AppointmentsPage({ mode }: AppointmentsPageProps) {
  const patientSession = useResolvedPatientSession(mode === 'patient');
  const patientId = mode === 'patient' ? patientSession.patientId : undefined;
  const waitingForPatient = mode === 'patient' && patientSession.isResolving && !patientId;
  const canShowAppointments = mode !== 'patient' || Boolean(patientId);
  const root = mode === 'patient' ? '/patient' : mode === 'nurse' ? '/nurse' : '/receptionist';
  const label = mode === 'patient' ? 'Patient' : mode === 'nurse' ? 'Nurse' : 'Receptionist';
  const canBookAppointments = mode !== 'nurse';
  const showScheduleActions = mode !== 'nurse';
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
  const appointmentsQuery = useAppointmentList(params, mode !== 'patient' || Boolean(patientId));
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
        subtitle={
          mode === 'patient'
            ? 'Upcoming and past appointment history'
            : mode === 'nurse'
              ? 'View facility appointments and patient visit details'
              : 'Facility appointment list'
        }
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            {mode !== 'patient' ? <ExportButton entity="appointments" /> : null}
            <Link to={`${root}/book-appointment`}>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                leftIcon={<PhoneCall className="h-4 w-4" aria-hidden="true" />}
              >
                Call
              </Button>
            </Link>
            <Link to={`${root}/book-appointment`}>
              <Button
                type="button"
                size="sm"
                leftIcon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
              >
                Book Appointment
              </Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-5">
          {waitingForPatient || appointmentsQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading appointments...</div>
          ) : null}

          {appointmentsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getApiErrorMessage(appointmentsQuery.error, 'Appointments could not be loaded')}
            />
          ) : null}

          {!waitingForPatient && canShowAppointments && !appointmentsQuery.isLoading && !appointmentsQuery.isError ? (
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
                        showScheduleActions={showScheduleActions}
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
                        showScheduleActions={showScheduleActions}
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

      <AppointmentDetailModal
        appointment={detailAppointment}
        showClinicalReport={mode === 'patient'}
        onClose={() => setDetailAppointment(null)}
      />
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
        publicAccess={mode === 'patient'}
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
