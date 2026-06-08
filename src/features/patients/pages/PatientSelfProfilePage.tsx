import { getApiErrorMessage, usePatientSelfProfile } from '@/features/patients/hooks/usePatients';
import PatientProfileLayout from '@/features/patients/components/PatientProfileLayout';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

export default function PatientSelfProfilePage() {
  const patientQuery = usePatientSelfProfile();

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Profile' }]} />

      {patientQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading your profile...</div> : null}
      {patientQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(patientQuery.error, 'Your patient profile could not be loaded')} /> : null}
      {patientQuery.data ? <PatientProfileLayout patient={patientQuery.data} selfView basePath="/patient" /> : null}
    </div>
  );
}
