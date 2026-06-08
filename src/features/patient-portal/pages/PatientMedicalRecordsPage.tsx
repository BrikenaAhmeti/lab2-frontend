import { useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { PdfDocumentPanel, PdfInfoGrid, PdfSection } from '@/components/pdf/PdfDocumentPanel';
import { resolvePatientId } from '@/features/appointments/hooks/useAppointments';
import { getConsultationErrorMessage, useMedicalRecords } from '@/features/consultation/hooks/useConsultation';
import type { MedicalRecordView } from '@/lib/api/medical-records-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { PatientPortalEmptyState, PatientPortalLoadingState } from '../components/PatientPortalStates';
import { downloadElementPdf } from '../components/patientPdfExport';
import { formatPatientPortalDate, getMedicalRecordPdfFileName } from '../components/patientPortalFormat';

export default function PatientMedicalRecordsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = resolvePatientId(user);
  const params = useMemo(() => ({ page: 1, limit: 50, patientId }), [patientId]);
  const recordsQuery = useMedicalRecords(params, Boolean(patientId));
  const records = (recordsQuery.data?.items ?? []).filter((record) => record.isFinalized);
  const [downloadId, setDownloadId] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const downloadPdf = async (record: MedicalRecordView) => {
    setDownloadId(record.id);
    setDownloadError('');

    try {
      const previewElement = previewRefs.current[record.id];

      if (!previewElement) {
        throw new Error('Medical record preview is not ready yet');
      }

      await downloadElementPdf(previewElement, getMedicalRecordPdfFileName(record));
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
            <div
              key={record.id}
              ref={(element) => {
                previewRefs.current[record.id] = element;
              }}
            >
              <PdfDocumentPanel
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
                  { label: 'Patient', value: record.patient.name },
                  { label: 'Doctor', value: record.staff.displayName },
                  { label: 'Department', value: record.department.name },
                  { label: 'Appointment', value: formatPatientPortalDate(record.appointment?.scheduledAt) },
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

                <PdfSection title="Record details" accent="blue">
                  <PdfInfoGrid
                    columns="two"
                    items={[
                      { label: 'Treatment plan', value: record.treatmentPlan },
                      { label: 'Notes', value: record.notes },
                      { label: 'Record ID', value: record.id },
                    ]}
                  />
                </PdfSection>
              </PdfDocumentPanel>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
