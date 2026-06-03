import { useMemo } from 'react';
import Button from '@/ui/atoms/Button';
import type { AppointmentView } from '@/lib/api/appointments-api';
import { getConsultationErrorMessage, useMedicalRecords } from '@/features/consultation/hooks/useConsultation';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { formatAppointmentDate } from './appointmentFormat';

interface AppointmentDetailModalProps {
  appointment: AppointmentView | null;
  showClinicalReport?: boolean;
  onClose: () => void;
}

export default function AppointmentDetailModal({ appointment, showClinicalReport = false, onClose }: AppointmentDetailModalProps) {
  const medicalRecordParams = useMemo(
    () => ({ page: 1, limit: 10, patientId: appointment?.patientId }),
    [appointment?.patientId]
  );
  const medicalRecordsQuery = useMedicalRecords(
    medicalRecordParams,
    showClinicalReport && Boolean(appointment?.patientId)
  );
  const appointmentRecord = useMemo(
    () =>
      (medicalRecordsQuery.data?.items ?? []).find(
        (record) => record.appointmentId === appointment?.id && record.isFinalized
      ) ?? null,
    [appointment?.id, medicalRecordsQuery.data?.items]
  );

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <section className="panel w-full max-w-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Appointment details</h2>
            <p className="mt-1 text-sm text-muted">{appointment.service.name}</p>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted">Patient</dt>
            <dd className="font-medium text-foreground">{appointment.patient.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Staff</dt>
            <dd className="font-medium text-foreground">{appointment.staff?.displayName ?? 'Staff member'}</dd>
          </div>
          <div>
            <dt className="text-muted">Department</dt>
            <dd className="font-medium text-foreground">{appointment.department.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Date and time</dt>
            <dd className="font-medium text-foreground">{formatAppointmentDate(appointment.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Duration</dt>
            <dd className="font-medium text-foreground">{`${appointment.durationMinutes} minutes`}</dd>
          </div>
          <div>
            <dt className="text-muted">Estimated fee</dt>
            <dd className="font-medium text-foreground">{`EUR ${Number(appointment.basePrice).toFixed(2)}`}</dd>
          </div>
        </dl>

        {appointment.notes ? (
          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3 text-sm">
            <p className="text-muted">Notes</p>
            <p className="mt-1 text-foreground">{appointment.notes}</p>
          </div>
        ) : null}

        {appointment.cancellationNote ? (
          <div className="mt-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
            {appointment.cancellationNote}
          </div>
        ) : null}

        {showClinicalReport ? (
          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3 text-sm">
            <p className="font-medium text-foreground">Consultation report</p>
            {medicalRecordsQuery.isLoading ? <p className="mt-2 text-muted">Loading report...</p> : null}
            {medicalRecordsQuery.isError ? (
              <div className="mt-2">
                <FeedbackMessage
                  type="error"
                  message={getConsultationErrorMessage(medicalRecordsQuery.error, 'Consultation report could not be loaded')}
                />
              </div>
            ) : null}
            {!medicalRecordsQuery.isLoading && !medicalRecordsQuery.isError && !appointmentRecord ? (
              <p className="mt-2 text-muted">No finalized report is available for this appointment yet.</p>
            ) : null}
            {appointmentRecord ? (
              <dl className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <dt className="text-muted">Diagnosis</dt>
                  <dd className="mt-1 font-medium text-foreground">{appointmentRecord.diagnosis || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Treatment plan</dt>
                  <dd className="mt-1 font-medium text-foreground">{appointmentRecord.treatmentPlan || '-'}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-muted">Summary</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-foreground">{appointmentRecord.notes || '-'}</dd>
                </div>
              </dl>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </section>
    </div>
  );
}
