import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { PdfDocumentPanel, PdfInfoGrid, PdfSection } from '@/components/pdf/PdfDocumentPanel';
import { useResolvedPatientSession } from '@/features/auth/hooks/useResolvedPatientSession';
import { getConsultationErrorMessage, usePrescriptions } from '@/features/consultation/hooks/useConsultation';
import { prescriptionsApi, type PrescriptionView } from '@/lib/api/prescriptions-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { PatientPortalEmptyState, PatientPortalLoadingState } from '../components/PatientPortalStates';
import {
  downloadPatientPdf,
  formatPatientPortalDate,
  formatPatientPortalStatus,
  pharmacyTone,
  prescriptionTone,
} from '../components/patientPortalFormat';

function fileName(prescription: PrescriptionView) {
  return `prescription-${prescription.id}.pdf`;
}

export default function PatientPrescriptionsPage() {
  const patientSession = useResolvedPatientSession();
  const patientId = patientSession.patientId;
  const waitingForPatient = patientSession.isResolving && !patientId;
  const params = useMemo(() => ({ page: 1, limit: 50, patientId }), [patientId]);
  const prescriptionsQuery = usePrescriptions(params, Boolean(patientId));
  const prescriptions = prescriptionsQuery.data?.items ?? [];
  const [downloadId, setDownloadId] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const downloadPdf = async (prescription: PrescriptionView) => {
    setDownloadId(prescription.id);
    setDownloadError('');

    try {
      const pdf = await prescriptionsApi.downloadPdf(prescription.id);
      downloadPatientPdf(pdf, fileName(prescription));
    } catch (error) {
      setDownloadError(getConsultationErrorMessage(error, 'Prescription PDF could not be downloaded'));
    } finally {
      setDownloadId('');
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Prescriptions' }]} />

      <Card title="Prescriptions" subtitle="Read-only medication history with MedSphere prescription PDFs">
        <div className="space-y-3">
          {waitingForPatient || prescriptionsQuery.isLoading ? <PatientPortalLoadingState>Loading prescriptions...</PatientPortalLoadingState> : null}
          {prescriptionsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getConsultationErrorMessage(prescriptionsQuery.error, 'Prescriptions could not be loaded')}
            />
          ) : null}
          {downloadError ? <FeedbackMessage type="error" message={downloadError} /> : null}
          {!waitingForPatient && Boolean(patientId) && !prescriptionsQuery.isLoading && !prescriptionsQuery.isError && prescriptions.length === 0 ? (
            <PatientPortalEmptyState>No prescriptions yet.</PatientPortalEmptyState>
          ) : null}

          {prescriptions.map((prescription) => (
            <PdfDocumentPanel
              key={prescription.id}
              documentLabel="Prescription PDF"
              title={`Prescription - ${formatPatientPortalDate(prescription.issuedAt)}`}
              subtitle={prescription.staff.displayName}
              accent="blue"
              status={
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge variant={prescriptionTone(prescription.status)}>
                    {formatPatientPortalStatus(prescription.status)}
                  </Badge>
                  {prescription.pharmacyStatus ? (
                    <Badge variant={pharmacyTone(prescription.pharmacyStatus)}>
                      {formatPatientPortalStatus(prescription.pharmacyStatus)}
                    </Badge>
                  ) : null}
                </div>
              }
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<Download size={16} />}
                  loading={downloadId === prescription.id}
                  onClick={() => downloadPdf(prescription)}
                >
                  Download PDF
                </Button>
              }
              meta={[
                { label: 'Prescriber', value: prescription.staff.displayName },
                { label: 'Issued', value: formatPatientPortalDate(prescription.issuedAt) },
                { label: 'Expires', value: formatPatientPortalDate(prescription.expiresAt) },
                { label: 'Diagnosis', value: prescription.medicalRecord?.diagnosis },
              ]}
            >
              <PdfSection title="Medication items" accent="blue">
                <div className="grid gap-3 md:grid-cols-2">
                  {prescription.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-surface/50 p-3">
                      <p className="font-medium text-foreground">{item.medicationName}</p>
                      <p className="mt-1 text-sm text-muted">{`${item.dosage} - ${item.frequency}`}</p>
                      {item.durationInstructions ? <p className="mt-1 text-sm text-muted">{item.durationInstructions}</p> : null}
                    </div>
                  ))}
                </div>
              </PdfSection>
              {prescription.notes ? (
                <PdfSection title="Clinical notes" accent="teal">
                  <PdfInfoGrid items={[{ label: 'Notes', value: prescription.notes }]} />
                </PdfSection>
              ) : null}
            </PdfDocumentPanel>
          ))}
        </div>
      </Card>
    </div>
  );
}
