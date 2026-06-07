import { useAppSelector } from '@/app/hooks';
import { getApiErrorMessage, usePatientDetail } from '@/features/patients/hooks/usePatients';
import PatientProfileLayout from '@/features/patients/components/PatientProfileLayout';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

type PatientAwareUser = {
  id: string;
  patientId?: string;
  patientProfileId?: string;
  profileId?: string;
};

function resolvePatientId(user: PatientAwareUser | null | undefined) {
  return user?.patientId ?? user?.patientProfileId ?? user?.profileId ?? user?.id ?? '';
}

export default function PatientSelfProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = resolvePatientId(user);
  const patientQuery = usePatientDetail(patientId);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Patient', to: '/patient' }, { label: 'Profile' }]} />

      {!patientId ? <FeedbackMessage type="error" message="Patient profile could not be resolved from your session" /> : null}
      {patientQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading your profile...</div> : null}
      {patientQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(patientQuery.error, 'Your patient profile could not be loaded')} /> : null}
      {patientQuery.data ? <PatientProfileLayout patient={patientQuery.data} selfView basePath="/patient" /> : null}
    </div>
  );
}
