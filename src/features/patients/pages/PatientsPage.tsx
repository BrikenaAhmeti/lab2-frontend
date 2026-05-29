import { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import ExportButton from '@/components/export/ExportButton';
import LazyImportWizard from '@/components/import/LazyImportWizard';
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
import { TableSkeleton } from '@/ui/atoms/Skeleton';

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
  const [showImportWizard, setShowImportWizard] = useState(false);
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

  const openImportWizard = useCallback(() => setShowImportWizard(true), []);
  const openRegisterModal = useCallback(() => setShowRegisterModal(true), []);
  const closeImportWizard = useCallback(() => setShowImportWizard(false), []);
  const goPreviousPage = useCallback(() => setPage((value) => Math.max(1, value - 1)), []);
  const goNextPage = useCallback(() => setPage((value) => value + 1), []);
  const closeRegisterModal = useCallback(() => {
    setFormError('');
    setShowRegisterModal(false);
  }, []);
  const handleImportCompleted = useCallback(() => {
    setFeedback('Patients imported successfully');
    void patientsQuery.refetch();
  }, [patientsQuery.refetch]);

  const submitPatient = useCallback(async (values: Record<string, string>) => {
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
  }, [createMutation]);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: basePath.startsWith('/admin') ? 'Admin' : 'Receptionist', to: basePath.startsWith('/admin') ? '/admin' : '/receptionist' }, { label: 'Patients' }]} />

      <Card
        title="Patients"
        subtitle="Search patient profiles and register new patients"
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <ExportButton entity="patients" />
            {canCreatePatients(permissions, roles) ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Upload className="h-4 w-4" />}
                  onClick={openImportWizard}
                >
                  Import
                </Button>
                <Button type="button" size="sm" onClick={openRegisterModal}>Register Patient</Button>
              </>
            ) : null}
          </div>
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
          {patientsQuery.isLoading ? <TableSkeleton rows={6} columns={7} /> : null}

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
                  <Button variant="secondary" size="sm" disabled={currentPage <= 1 || patientsQuery.isFetching} onClick={goPreviousPage}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={currentPage >= totalPages || patientsQuery.isFetching} onClick={goNextPage}>
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
        onClose={closeRegisterModal}
        onSubmit={submitPatient}
      />
      <LazyImportWizard
        open={showImportWizard}
        entity="patients"
        title="Import Patients"
        onClose={closeImportWizard}
        onCompleted={handleImportCompleted}
      />
    </div>
  );
}
