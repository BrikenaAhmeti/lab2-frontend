import { useEffect, useMemo, useState } from 'react';
import type { AppointmentView } from '@/lib/api/appointments-api';
import AppointmentDetailModal from '@/features/appointments/components/AppointmentDetailModal';
import NurseScheduleTable from '@/features/appointments/components/NurseScheduleTable';
import {
  getApiErrorMessage as getAppointmentErrorMessage,
  useTodayAppointments,
  useUpdateAppointmentStatus,
} from '@/features/appointments/hooks/useAppointments';
import PatientHistoryBrowser from '@/features/consultation/components/PatientHistoryBrowser';
import PatientSummaryPanel from '@/features/consultation/components/PatientSummaryPanel';
import PrescriptionList from '@/features/consultation/components/PrescriptionList';
import { useMedicalRecords, usePrescriptions } from '@/features/consultation/hooks/useConsultation';
import { usePatientDetail } from '@/features/patients/hooks/usePatients';
import { useStaffDetail } from '@/features/staff/hooks/useStaff';
import { useAppSelector } from '@/app/hooks';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import Card from '@/ui/atoms/Card';

const emptyAppointments: AppointmentView[] = [];

function departmentKey(value: { departmentId?: string; department?: { id: string } }) {
  return value.departmentId ?? value.department?.id ?? '';
}

export default function NurseDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const staffQuery = useStaffDetail(user?.profileId ?? '');
  const todayQuery = useTodayAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const [departmentId, setDepartmentId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentView | null>(null);
  const [detailAppointment, setDetailAppointment] = useState<AppointmentView | null>(null);
  const [actionError, setActionError] = useState('');

  const departmentOptions = useMemo(() => {
    const options = new Map<string, string>();
    const departments = staffQuery.data?.departments ?? [];

    departments.forEach((assignment) => {
      const id = departmentKey(assignment);
      if (!id) return;
      options.set(id, assignment.department?.name ?? assignment.name ?? 'Department');
    });

    return Array.from(options, ([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [staffQuery.data?.departments]);

  useEffect(() => {
    if (departmentId) return;
    const departments = staffQuery.data?.departments ?? [];
    if (departments.length === 0) return;

    const primary = departments.find((assignment) => assignment.isPrimary);
    const fallback = primary ?? departments[0];
    const nextDepartmentId = departmentKey(fallback);

    if (nextDepartmentId) {
      setDepartmentId(nextDepartmentId);
    }
  }, [departmentId, staffQuery.data?.departments]);

  const appointments = todayQuery.data ?? emptyAppointments;
  const scopedAppointments = useMemo(() => {
    const filtered = departmentId
      ? appointments.filter((appointment) => appointment.departmentId === departmentId)
      : appointments;

    return [...filtered].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [appointments, departmentId]);

  const patientId = selectedAppointment?.patientId ?? '';
  const patientQuery = usePatientDetail(patientId);
  const recordsQuery = useMedicalRecords({ page: 1, limit: 25, patientId }, Boolean(patientId));
  const prescriptionsQuery = usePrescriptions(
    { page: 1, limit: 25, patientId, isVoided: false },
    Boolean(patientId)
  );

  const updateStatus = async (appointment: AppointmentView, action: 'check-in' | 'start') => {
    setActionError('');

    try {
      await updateStatusMutation.mutateAsync({ id: appointment.id, payload: { action } });
    } catch (error) {
      setActionError(getAppointmentErrorMessage(error, 'Appointment status could not be updated'));
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Nurse', to: '/nurse' }, { label: 'Dashboard' }]} />

      {staffQuery.isError ? (
        <FeedbackMessage type="error" message="Your staff profile could not be loaded. Showing all appointments." />
      ) : null}

      {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}
      {todayQuery.isError ? (
        <FeedbackMessage
          type="error"
          message={getAppointmentErrorMessage(todayQuery.error, "Today's appointments could not be loaded")}
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card
          title="Today's Schedule"
          subtitle={departmentId ? 'Appointments in your assigned department' : 'Appointments sorted by time'}
          actions={
            departmentOptions.length > 1 ? (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Department</span>
                <select
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(event.target.value);
                    setSelectedAppointment(null);
                  }}
                  className="w-full min-w-56 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {departmentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null
          }
        >
          {todayQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading schedule...</div>
          ) : null}

          {!todayQuery.isLoading && !todayQuery.isError ? (
            <NurseScheduleTable
              appointments={scopedAppointments}
              actionLoading={updateStatusMutation.isPending}
              onQuickView={(appointment) => setSelectedAppointment(appointment)}
              onDetail={(appointment) => setDetailAppointment(appointment)}
              onCheckIn={(appointment) => updateStatus(appointment, 'check-in')}
              onMarkReady={(appointment) => updateStatus(appointment, 'start')}
            />
          ) : null}
        </Card>

        {selectedAppointment ? (
          <div className="space-y-4">
            <PatientSummaryPanel
              patient={patientQuery.data ?? null}
              records={recordsQuery.data?.items ?? []}
              prescriptions={prescriptionsQuery.data?.items ?? []}
              loading={patientQuery.isLoading || recordsQuery.isLoading || prescriptionsQuery.isLoading}
            />
            <PrescriptionList
              prescriptions={prescriptionsQuery.data?.items ?? []}
              loading={prescriptionsQuery.isLoading}
            />
            <PatientHistoryBrowser
              records={recordsQuery.data?.items ?? []}
              loading={recordsQuery.isLoading}
            />
          </div>
        ) : (
          <Card title="Patient Quick View" subtitle="Select an appointment to review the patient summary">
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              No appointment selected.
            </div>
          </Card>
        )}
      </div>

      <AppointmentDetailModal appointment={detailAppointment} onClose={() => setDetailAppointment(null)} />
    </div>
  );
}
