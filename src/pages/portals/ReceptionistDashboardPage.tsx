import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AppointmentView } from '@/lib/api/appointments-api';
import AppointmentDetailModal from '@/features/appointments/components/AppointmentDetailModal';
import CancelAppointmentDialog from '@/features/appointments/components/CancelAppointmentDialog';
import ReceptionistDashboardStats from '@/features/appointments/components/ReceptionistDashboardStats';
import ReceptionistScheduleFilters from '@/features/appointments/components/ReceptionistScheduleFilters';
import ReceptionistScheduleTable from '@/features/appointments/components/ReceptionistScheduleTable';
import RescheduleAppointmentDialog from '@/features/appointments/components/RescheduleAppointmentDialog';
import {
  getApiErrorMessage as getAppointmentErrorMessage,
  useCancelAppointment,
  useRescheduleAppointment,
  useTodayAppointments,
  useUpdateAppointmentStatus,
} from '@/features/appointments/hooks/useAppointments';
import PatientRegisterModal from '@/features/patients/components/PatientRegisterModal';
import {
  getApiErrorMessage as getPatientErrorMessage,
  toPatientPayload,
  useCreatePatient,
} from '@/features/patients/hooks/usePatients';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

const emptyAppointments: AppointmentView[] = [];

function uniqueOptions(appointments: AppointmentView[], field: 'department' | 'staff') {
  const options = new Map<string, string>();

  appointments.forEach((appointment) => {
    if (field === 'department') {
      options.set(appointment.department.id, appointment.department.name);
      return;
    }

    if (appointment.staff) {
      options.set(appointment.staff.id, appointment.staff.displayName);
    }
  });

  return Array.from(options, ([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
}

export default function ReceptionistDashboardPage() {
  const navigate = useNavigate();
  const todayQuery = useTodayAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();
  const createPatientMutation = useCreatePatient();
  const [departmentId, setDepartmentId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [detailAppointment, setDetailAppointment] = useState<AppointmentView | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<AppointmentView | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<AppointmentView | null>(null);
  const [showWalkInPatient, setShowWalkInPatient] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [patientError, setPatientError] = useState('');

  const appointments = todayQuery.data ?? emptyAppointments;
  const departmentOptions = useMemo(() => uniqueOptions(appointments, 'department'), [appointments]);
  const staffOptions = useMemo(() => uniqueOptions(appointments, 'staff'), [appointments]);
  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const matchesDepartment = !departmentId || appointment.departmentId === departmentId;
        const matchesStaff = !staffId || appointment.staffProfileId === staffId;

        return matchesDepartment && matchesStaff;
      }),
    [appointments, departmentId, staffId]
  );

  const closeCancel = () => {
    setCancelAppointment(null);
    setCancelReason('');
    setActionError('');
  };

  const closeReschedule = () => {
    setRescheduleAppointment(null);
    setActionError('');
  };

  const updateStatus = async (appointment: AppointmentView, action: 'check-in' | 'no-show') => {
    setActionError('');

    try {
      await updateStatusMutation.mutateAsync({ id: appointment.id, payload: { action } });
    } catch (error) {
      setActionError(getAppointmentErrorMessage(error, 'Appointment status could not be updated'));
    }
  };

  const confirmCancel = async () => {
    if (!cancelAppointment || !cancelReason.trim()) return;
    setActionError('');

    try {
      await cancelMutation.mutateAsync({ id: cancelAppointment.id, reason: cancelReason });
      closeCancel();
    } catch (error) {
      setActionError(getAppointmentErrorMessage(error, 'Appointment could not be cancelled'));
    }
  };

  const registerWalkInPatient = async (values: Record<string, string>) => {
    setPatientError('');

    try {
      const patient = await createPatientMutation.mutateAsync(toPatientPayload(values));
      setShowWalkInPatient(false);
      navigate('/receptionist/book-appointment', {
        state: {
          appointmentType: 'WALK_IN',
          patient,
        },
      });
    } catch (error) {
      setPatientError(getPatientErrorMessage(error, 'Patient could not be registered'));
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Receptionist', to: '/receptionist' }, { label: 'Dashboard' }]} />

      <ReceptionistDashboardStats appointments={appointments} />

      <Card
        title="Today's Schedule"
        subtitle="Facility-wide appointments sorted by time"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowWalkInPatient(true)}>
              Walk-in
            </Button>
            <Link to="/receptionist/book-appointment">
              <Button type="button">Book on behalf</Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          <ReceptionistScheduleFilters
            departmentId={departmentId}
            staffId={staffId}
            departments={departmentOptions}
            staff={staffOptions}
            onDepartmentChange={setDepartmentId}
            onStaffChange={setStaffId}
          />

          {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}
          {todayQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getAppointmentErrorMessage(todayQuery.error, "Today's appointments could not be loaded")}
            />
          ) : null}
          {todayQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading today's schedule...</div>
          ) : null}

          {!todayQuery.isLoading && !todayQuery.isError ? (
            <ReceptionistScheduleTable
              appointments={filteredAppointments}
              actionLoading={updateStatusMutation.isPending}
              onCheckIn={(appointment) => updateStatus(appointment, 'check-in')}
              onNoShow={(appointment) => updateStatus(appointment, 'no-show')}
              onCancel={(appointment) => {
                setCancelAppointment(appointment);
                setActionError('');
              }}
              onReschedule={(appointment) => {
                setRescheduleAppointment(appointment);
                setActionError('');
              }}
              onDetail={setDetailAppointment}
            />
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
            setActionError(getAppointmentErrorMessage(error, 'Appointment could not be rescheduled'));
          }
        }}
      />
      <PatientRegisterModal
        open={showWalkInPatient}
        loading={createPatientMutation.isPending}
        error={patientError}
        onClose={() => {
          setShowWalkInPatient(false);
          setPatientError('');
        }}
        onSubmit={registerWalkInPatient}
      />
    </div>
  );
}
