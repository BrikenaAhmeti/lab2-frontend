import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { PdfDocumentPanel, PdfInfoGrid, PdfSection } from '@/components/pdf/PdfDocumentPanel';
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

      <Card title="Medical Records" subtitle="Finalized consultation PDFs with MedSphere document previews">
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
            <PdfDocumentPanel
              key={record.id}
              documentLabel="Medical Record PDF"
              title={record.diagnosis || 'Consultation record'}
              subtitle={formatPatientPortalDate(record.createdAt)}
              accent="teal"
              status={
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge variant="success">Finalized</Badge>
                  <Badge>{record.department.name}</Badge>
                </div>
              }
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download size={16} />}
                  loading={downloadId === record.id}
                  onClick={() => downloadPdf(record)}
                >
                  Download PDF
                </Button>
              }
              meta={[
                { label: 'Doctor', value: record.staff.displayName },
                { label: 'Department', value: record.department.name },
                { label: 'Appointment', value: formatPatientPortalDate(record.appointment?.scheduledAt) },
                { label: 'Record ID', value: record.id },
              ]}
            >
              <PdfSection title="Clinical summary" accent="teal">
                <PdfInfoGrid
                  columns="two"
                  items={[
                    { label: 'Chief complaint', value: record.chiefComplaint },
                    { label: 'Diagnosis', value: record.diagnosis },
                    { label: 'Follow-up', value: record.followUpInstructions },
                  ]}
                />
              </PdfSection>

              <details className="rounded-lg border border-border bg-surface/50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground">View details</summary>
                <PdfInfoGrid
                  className="mt-4"
                  columns="two"
                  items={[
                    { label: 'Doctor', value: record.staff.displayName },
                    { label: 'Chief complaint', value: record.chiefComplaint },
                    { label: 'Diagnosis', value: record.diagnosis },
                    { label: 'Treatment plan', value: record.treatmentPlan },
                    { label: 'Follow-up', value: record.followUpInstructions },
                    { label: 'Notes', value: record.notes },
                  ]}
                />
              </details>
            </PdfDocumentPanel>
          ))}
        </div>
      </Card>
    </div>
  );
}
