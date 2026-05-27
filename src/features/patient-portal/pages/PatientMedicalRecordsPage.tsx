import { useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { resolvePatientId } from '@/features/appointments/hooks/useAppointments';
import { getConsultationErrorMessage, useMedicalRecords } from '@/features/consultation/hooks/useConsultation';
import { medicalRecordsApi, type MedicalRecordView } from '@/lib/api/medical-records-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { PatientPortalEmptyState, PatientPortalLoadingState } from '../components/PatientPortalStates';
import { downloadPatientPdf, formatPatientPortalDate } from '../components/patientPortalFormat';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || '-'}</p>
    </div>
  );
}

function fileName(record: MedicalRecordView) {
  return `medical-record-${record.id}.pdf`;
}

export default function PatientMedicalRecordsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = resolvePatientId(user);
  const params = useMemo(() => ({ page: 1, limit: 50, patientId }), [patientId]);
  const recordsQuery = useMedicalRecords(params, Boolean(patientId));
  const records = (recordsQuery.data?.items ?? []).filter((record) => record.isFinalized);
  const [downloadId, setDownloadId] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const downloadPdf = async (record: MedicalRecordView) => {
    setDownloadId(record.id);
    setDownloadError('');

    try {
      const pdf = await medicalRecordsApi.downloadPdf(record.id);
      downloadPatientPdf(pdf, fileName(record));
    } catch (error) {
      setDownloadError(getConsultationErrorMessage(error, 'Medical record PDF could not be downloaded'));
    } finally {
      setDownloadId('');
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Medical Records' }]} />

      {!patientId ? <FeedbackMessage type="error" message="Patient profile could not be resolved from your session" /> : null}

      <Card title="Medical Records" subtitle="Finalized consultation records with read-only details">
        <div className="space-y-3">
          {recordsQuery.isLoading ? <PatientPortalLoadingState>Loading medical records...</PatientPortalLoadingState> : null}
          {recordsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getConsultationErrorMessage(recordsQuery.error, 'Medical records could not be loaded')}
            />
          ) : null}
          {downloadError ? <FeedbackMessage type="error" message={downloadError} /> : null}
          {!recordsQuery.isLoading && !recordsQuery.isError && records.length === 0 ? (
            <PatientPortalEmptyState>No finalized medical records yet.</PatientPortalEmptyState>
          ) : null}

          {records.map((record) => (
            <article key={record.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Finalized</Badge>
                    <Badge>{record.department.name}</Badge>
                  </div>
                  <h2 className="mt-2 font-semibold text-foreground">{record.diagnosis || 'Consultation record'}</h2>
                  <p className="mt-1 text-sm text-muted">{formatPatientPortalDate(record.createdAt)}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={downloadId === record.id}
                  onClick={() => downloadPdf(record)}
                >
                  Download PDF
                </Button>
              </div>

              <details className="mt-4 rounded-lg border border-border bg-surface/50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">View details</summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Doctor" value={record.staff.displayName} />
                  <Field label="Chief complaint" value={record.chiefComplaint} />
                  <Field label="Diagnosis" value={record.diagnosis} />
                  <Field label="Treatment plan" value={record.treatmentPlan} />
                  <Field label="Follow-up" value={record.followUpInstructions} />
                  <Field label="Notes" value={record.notes} />
                </div>
              </details>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
