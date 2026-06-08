import { useParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import { getApiErrorMessage, usePatientDetail } from '@/features/patients/hooks/usePatients';
import PatientProfileLayout from '@/features/patients/components/PatientProfileLayout';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

type BasePath = '/admin' | '/receptionist' | '/nurse';

function canReadPatients(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin', 'Receptionist', 'Nurse']) ||
    hasAnyPermission(permissions, ['patients:read', 'patients:read:all'], 'any')
  );
}

function portalLabel(basePath: BasePath) {
  if (basePath === '/admin') return 'Admin';
  if (basePath === '/nurse') return 'Nurse';
  return 'Receptionist';
}

export default function PatientProfilePage({ basePath = '/admin' }: { basePath?: BasePath }) {
  const { id = '' } = useParams();
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const patientQuery = usePatientDetail(id);

  if (!canReadPatients(permissions, roles)) {
    return <Forbidden />;
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: portalLabel(basePath), to: basePath },
          { label: 'Patients', to: `${basePath}/patients` },
          { label: 'Profile' },
        ]}
      />

      {patientQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading patient profile...</div> : null}
      {patientQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(patientQuery.error, 'Patient profile could not be loaded')} /> : null}
      {patientQuery.data ? <PatientProfileLayout patient={patientQuery.data} basePath={basePath} /> : null}
    </div>
  );
}
