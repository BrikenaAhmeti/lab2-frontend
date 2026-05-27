import { useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { resolvePatientId } from '@/features/appointments/hooks/useAppointments';
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
  const user = useAppSelector((state) => state.auth.user);
  const patientId = resolvePatientId(user);
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

      {!patientId ? <FeedbackMessage type="error" message="Patient profile could not be resolved from your session" /> : null}

      <Card title="Prescriptions" subtitle="Read-only medication history and downloadable prescription PDFs">
        <div className="space-y-3">
          {prescriptionsQuery.isLoading ? <PatientPortalLoadingState>Loading prescriptions...</PatientPortalLoadingState> : null}
          {prescriptionsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getConsultationErrorMessage(prescriptionsQuery.error, 'Prescriptions could not be loaded')}
            />
          ) : null}
          {downloadError ? <FeedbackMessage type="error" message={downloadError} /> : null}
          {!prescriptionsQuery.isLoading && !prescriptionsQuery.isError && prescriptions.length === 0 ? (
            <PatientPortalEmptyState>No prescriptions yet.</PatientPortalEmptyState>
          ) : null}

          {prescriptions.map((prescription) => (
            <article key={prescription.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={prescriptionTone(prescription.status)}>
                      {formatPatientPortalStatus(prescription.status)}
                    </Badge>
                    {prescription.pharmacyStatus ? (
                      <Badge variant={pharmacyTone(prescription.pharmacyStatus)}>
                        {formatPatientPortalStatus(prescription.pharmacyStatus)}
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-semibold text-foreground">{`Issued ${formatPatientPortalDate(prescription.issuedAt)}`}</h2>
                  <p className="mt-1 text-sm text-muted">{prescription.staff.displayName}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={downloadId === prescription.id}
                  onClick={() => downloadPdf(prescription)}
                >
                  Download PDF
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {prescription.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-surface/50 p-3">
                    <p className="font-medium text-foreground">{item.medicationName}</p>
                    <p className="mt-1 text-sm text-muted">{`${item.dosage} - ${item.frequency}`}</p>
                    {item.durationInstructions ? <p className="mt-1 text-sm text-muted">{item.durationInstructions}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
