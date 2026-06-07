import { useCallback, useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, Upload } from 'lucide-react';
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
import { bloodTypeOptions, formatBloodType } from '@/features/patients/components/patientFormat';
import type { BloodType } from '@/lib/api/patients-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import DateModeFilter, {
  dateModeFilterToRange,
  emptyDateModeFilterValue,
  formatDateModeFilterSummary,
  isDateModeFilterActive,
  type DateModeFilterValue,
} from '@/ui/molecules/DateModeFilter';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import FilterSummaryBar, { type FilterSummaryChip } from '@/ui/molecules/FilterSummaryBar';
import Pagination from '@/ui/molecules/Pagination';
import SelectField from '@/ui/molecules/SelectField';
import { TableSkeleton } from '@/ui/atoms/Skeleton';

type BasePath = '/admin/patients' | '/receptionist/patients';
type GenderFilter = 'all' | 'female' | 'male' | 'other';
type ActiveFilter = 'all' | 'active' | 'inactive';

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

const defaultPageSize = 10;
const patientBirthDateMin = '1900-01-01';
const genderOptions: Array<{ value: Exclude<GenderFilter, 'all'>; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Others' },
];

function genderLabel(value: GenderFilter) {
  if (value === 'all') return 'All genders';
  return genderOptions.find((option) => option.value === value)?.label ?? value;
}

function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

export default function PatientsPage({ basePath = '/admin/patients' }: { basePath?: BasePath }) {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<GenderFilter>('all');
  const [bloodType, setBloodType] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [birthDateFilter, setBirthDateFilter] = useState<DateModeFilterValue>(emptyDateModeFilterValue);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');
  const createMutation = useCreatePatient();
  const birthDateRange = useMemo(() => dateModeFilterToRange(birthDateFilter), [birthDateFilter]);
  const patientBirthDateMax = useMemo(() => todayInputValue(), []);

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      gender: gender === 'all' ? undefined : gender,
      bloodType: (bloodType || undefined) as BloodType | undefined,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      dateOfBirthFrom: birthDateRange.from,
      dateOfBirthTo: birthDateRange.to,
    }),
    [activeFilter, birthDateRange.from, birthDateRange.to, bloodType, gender, limit, page, search]
  );

  const patientsQuery = usePatientList(params);
  const rows = patientsQuery.data?.items ?? [];
  const paginationMeta = patientsQuery.data?.meta;

  useEffect(() => {
    if (paginationMeta && paginationMeta.totalPages > 0 && page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta]);

  if (!canReadPatients(permissions, roles)) {
    return <Forbidden />;
  }

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateGender = (value: GenderFilter) => {
    setGender(value);
    setPage(1);
  };

  const updateBloodType = (value: string) => {
    setBloodType(value);
    setPage(1);
  };

  const updateActiveFilter = (value: ActiveFilter) => {
    setActiveFilter(value);
    setPage(1);
  };

  const updateBirthDateFilter = (value: DateModeFilterValue) => {
    setBirthDateFilter(value);
    setPage(1);
  };

  const updateLimit = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setGender('all');
    setBloodType('');
    setActiveFilter('all');
    setBirthDateFilter(emptyDateModeFilterValue);
    setPage(1);
  };

  const openImportWizard = useCallback(() => setShowImportWizard(true), []);
  const openRegisterModal = useCallback(() => setShowRegisterModal(true), []);
  const closeImportWizard = useCallback(() => setShowImportWizard(false), []);
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

  const filterChips: FilterSummaryChip[] = [];
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    filterChips.push({ id: 'search', label: `Search: ${trimmedSearch}`, onRemove: () => updateSearch('') });
  }

  if (gender !== 'all') {
    filterChips.push({ id: 'gender', label: `Gender: ${genderLabel(gender)}`, onRemove: () => updateGender('all') });
  }

  if (activeFilter !== 'all') {
    filterChips.push({
      id: 'status',
      label: activeFilter === 'active' ? 'Active only' : 'Inactive only',
      onRemove: () => updateActiveFilter('all'),
    });
  }

  if (bloodType) {
    filterChips.push({
      id: 'blood-type',
      label: `Blood: ${formatBloodType(bloodType as BloodType)}`,
      onRemove: () => updateBloodType(''),
    });
  }

  if (isDateModeFilterActive(birthDateFilter)) {
    filterChips.push({
      id: 'birth-date',
      label: `Born: ${formatDateModeFilterSummary(birthDateFilter)}`,
      onRemove: () => updateBirthDateFilter(emptyDateModeFilterValue),
    });
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: basePath.startsWith('/admin') ? 'Admin' : 'Receptionist', to: basePath.startsWith('/admin') ? '/admin' : '/receptionist' }, { label: 'Patients' }]} />

      <Card
        title="Patients"
        subtitle="Search patient profiles and register new patients"
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <ExportButton entity="patients" excludeFields={['userId']} />
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
          <section className="space-y-4 rounded-xl border border-border bg-surface/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  <p className="mt-0.5 text-xs text-muted">Patient demographics and status</p>
                </div>
              </div>
              {patientsQuery.isFetching ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_160px_160px_180px_280px]">
              <Input
                id="patient-search"
                label="Search"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search name, email, phone, personal number..."
              />
              <SelectField
                id="patient-gender-filter"
                label="Gender"
                value={gender}
                onChange={(event) => updateGender(event.target.value as GenderFilter)}
              >
                <option value="all">All genders</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="patient-status-filter"
                label="Status"
                value={activeFilter}
                onChange={(event) => updateActiveFilter(event.target.value as ActiveFilter)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>
              <SelectField
                id="patient-blood-type-filter"
                label="Blood type"
                value={bloodType}
                onChange={(event) => updateBloodType(event.target.value)}
              >
                <option value="">All blood types</option>
                {bloodTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <DateModeFilter
                id="patient-birth-date-filter"
                label="Birth date"
                value={birthDateFilter}
                minDate={patientBirthDateMin}
                maxDate={patientBirthDateMax}
                singleDateLabel="Born on"
                rangeStartLabel="Born from"
                rangeEndLabel="Born to"
                onChange={updateBirthDateFilter}
              />
            </div>

            <FilterSummaryBar chips={filterChips} onClear={clearFilters} />
          </section>

          {feedback ? <FeedbackMessage type="success" message={feedback} /> : null}
          {patientsQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(patientsQuery.error, 'Patients could not be loaded')} /> : null}
          {patientsQuery.isLoading ? <TableSkeleton rows={6} columns={8} /> : null}

          {!patientsQuery.isLoading && !patientsQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No patients found.
            </p>
          ) : null}

          {!patientsQuery.isLoading && !patientsQuery.isError && rows.length > 0 ? (
            <PatientTable rows={rows} basePath={basePath} />
          ) : null}

          {!patientsQuery.isLoading && !patientsQuery.isError && paginationMeta ? (
            <Pagination
              page={page}
              totalPages={paginationMeta.totalPages}
              total={paginationMeta.total}
              limit={limit}
              loading={patientsQuery.isFetching}
              onPageChange={setPage}
              onLimitChange={updateLimit}
            />
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
