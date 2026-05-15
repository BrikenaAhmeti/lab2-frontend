import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import {
  getApiErrorMessage,
  toPatientPayload,
  useCreatePatient,
  usePatientList,
} from '@/features/patients/hooks/usePatients';
import PatientRegisterModal from '@/features/patients/components/PatientRegisterModal';
import PatientTable from '@/features/patients/components/PatientTable';
import { bloodTypeOptions } from '@/features/patients/components/patientFormat';
import type { BloodType } from '@/lib/api/patients-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

type BasePath = '/admin/patients' | '/receptionist/patients';

function canReadPatients(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin', 'Receptionist']) ||
    hasAnyPermission(permissions, ['patients:read', 'patients:read:all', 'patients:create', 'patients:update'], 'any')
  );
}

function canCreatePatients(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin', 'Receptionist']) ||
    hasAnyPermission(permissions, ['patients:create', 'patients:create:all'], 'any')
  );
}

const pageSize = 10;

export default function PatientsPage({ basePath = '/admin/patients' }: { basePath?: BasePath }) {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [page, setPage] = useState(1);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');
  const createMutation = useCreatePatient();

  const params = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      gender: gender.trim() || undefined,
      bloodType: (bloodType || undefined) as BloodType | undefined,
    }),
    [bloodType, gender, page, search]
  );

  const patientsQuery = usePatientList(params);
  const rows = patientsQuery.data?.items ?? [];
  const currentPage = patientsQuery.data?.meta.page ?? page;
  const totalPages = patientsQuery.data?.meta.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [search, gender, bloodType]);

  if (!canReadPatients(permissions, roles)) {
    return <Forbidden />;
  }

  const submitPatient = async (values: Record<string, string>) => {
    setFormError('');
    setFeedback('');

    try {
      const patient = await createMutation.mutateAsync(toPatientPayload(values));
      setFeedback('Patient registered successfully');
      setShowRegisterModal(false);
      setPage(1);
      void patient;
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Patient could not be registered'));
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: basePath.startsWith('/admin') ? 'Admin' : 'Receptionist', to: basePath.startsWith('/admin') ? '/admin' : '/receptionist' }, { label: 'Patients' }]} />

      <Card
        title="Patients"
        subtitle="Search patient profiles and register new patients"
        actions={
          canCreatePatients(permissions, roles) ? (
            <Button type="button" onClick={() => setShowRegisterModal(true)}>Register Patient</Button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone, personal number..." />
            <Input value={gender} onChange={(event) => setGender(event.target.value)} placeholder="Gender" />
            <select
              value={bloodType}
              onChange={(event) => setBloodType(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All blood types</option>
              {bloodTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {feedback ? <FeedbackMessage type="success" message={feedback} /> : null}
          {patientsQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(patientsQuery.error, 'Patients could not be loaded')} /> : null}
          {patientsQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading patients...</div> : null}

          {!patientsQuery.isLoading && !patientsQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No patients found.
            </p>
          ) : null}

          {!patientsQuery.isLoading && !patientsQuery.isError && rows.length > 0 ? (
            <>
              <PatientTable rows={rows} basePath={basePath} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">{`Page ${currentPage} of ${Math.max(totalPages, 1)}`}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={currentPage <= 1 || patientsQuery.isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={currentPage >= totalPages || patientsQuery.isFetching} onClick={() => setPage((value) => value + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </Card>

      <PatientRegisterModal
        open={showRegisterModal}
        loading={createMutation.isPending}
        error={formError}
        onClose={() => {
          setFormError('');
          setShowRegisterModal(false);
        }}
        onSubmit={submitPatient}
      />
    </div>
  );
}
