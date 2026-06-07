import { useEffect, useMemo, useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import {
  getApiErrorMessage,
  toStaffPositionTypePayload,
  useCreateStaffPositionType,
  useDeleteStaffPositionType,
  useStaffPositionTypeDepartments,
  useStaffPositionTypesList,
  useUpdateStaffPositionType,
} from '@/features/staff-position-types/hooks/useStaffPositionTypes';
import StaffPositionTypesTable from '@/features/staff-position-types/components/StaffPositionTypesTable';
import StaffPositionTypeFormModal from '@/features/staff-position-types/components/StaffPositionTypeFormModal';
import DeleteStaffPositionTypeDialog from '@/features/staff-position-types/components/DeleteStaffPositionTypeDialog';
import type { StaffPositionTypeFormValues } from '@/features/staff-position-types/staffPositionTypes.schemas';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import type { StaffPositionTypeRecord } from '@/lib/api/staff-position-types-api';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import { TableSkeleton } from '@/ui/atoms/Skeleton';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import FilterSummaryBar, { type FilterSummaryChip } from '@/ui/molecules/FilterSummaryBar';
import Pagination from '@/ui/molecules/Pagination';
import SelectField from '@/ui/molecules/SelectField';
import { organizationBreadcrumbs } from './organizationBreadcrumbs';

type StatusFilter = 'all' | 'active' | 'inactive';
type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const defaultPageSize = 10;

export default function StaffPositionTypesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const isAdmin = hasAnyRole(roles, ['Admin', 'Super Admin']);
  const canRead =
    isAdmin ||
    hasAnyPermission(
      permissions,
      ['staff-position-types:read', 'staff-position-types:manage', 'staff-position-types:manage:all', 'staff_types:manage'],
      'any'
    );
  const canManage =
    isAdmin ||
    hasAnyPermission(permissions, ['staff-position-types:manage', 'staff-position-types:manage:all', 'staff_types:manage'], 'any');

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffPositionTypeRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<StaffPositionTypeRecord | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      departmentId: departmentId || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [departmentId, limit, page, search, statusFilter]
  );

  const staffPositionTypesQuery = useStaffPositionTypesList(listParams);
  const departmentsQuery = useStaffPositionTypeDepartments();
  const createMutation = useCreateStaffPositionType();
  const updateMutation = useUpdateStaffPositionType();
  const deleteMutation = useDeleteStaffPositionType();

  const rows = staffPositionTypesQuery.data?.items ?? [];
  const departments = departmentsQuery.data ?? [];
  const paginationMeta = useMemo(() => {
    if (staffPositionTypesQuery.data?.meta) {
      return staffPositionTypesQuery.data.meta;
    }

    if (!staffPositionTypesQuery.data) {
      return undefined;
    }

    return {
      page,
      limit,
      total: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / limit)),
    };
  }, [limit, page, rows.length, staffPositionTypesQuery.data]);
  const mutationPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (paginationMeta && paginationMeta.totalPages > 0 && page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta]);

  if (!canRead) {
    return <Forbidden />;
  }

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateDepartmentId = (value: string) => {
    setDepartmentId(value);
    setPage(1);
  };

  const updateStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const updateLimit = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setDepartmentId('');
    setStatusFilter('all');
    setPage(1);
  };

  const openCreateModal = () => {
    setFeedback(null);
    setFormError('');
    setEditingRecord(null);
    setShowFormModal(true);
  };

  const openEditModal = (record: StaffPositionTypeRecord) => {
    setFeedback(null);
    setFormError('');
    setEditingRecord(record);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setFormError('');
    setEditingRecord(null);
    setShowFormModal(false);
  };

  const submitForm = async (values: StaffPositionTypeFormValues) => {
    setFeedback(null);
    setFormError('');

    const payload = toStaffPositionTypePayload(values);

    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({ id: editingRecord.id, payload });
        setFeedback({ type: 'success', message: 'Staff position type updated successfully' });
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback({ type: 'success', message: 'Staff position type created successfully' });
      }

      closeFormModal();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Staff position type could not be saved'));
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) {
      return;
    }

    setFeedback(null);
    setDeleteError('');

    try {
      await deleteMutation.mutateAsync(recordToDelete.id);
      setFeedback({ type: 'success', message: 'Staff position type deleted successfully' });
      setRecordToDelete(null);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Staff position type could not be deleted'));
    }
  };

  const filterChips: FilterSummaryChip[] = [];
  const trimmedSearch = search.trim();
  const selectedDepartment = departments.find((department) => department.id === departmentId);

  if (trimmedSearch) {
    filterChips.push({ id: 'search', label: `Name: ${trimmedSearch}`, onRemove: () => updateSearch('') });
  }

  if (selectedDepartment) {
    filterChips.push({
      id: 'department',
      label: `Department: ${selectedDepartment.name}`,
      onRemove: () => updateDepartmentId(''),
    });
  }

  if (statusFilter !== 'all') {
    filterChips.push({
      id: 'status',
      label: statusFilter === 'active' ? 'Active only' : 'Inactive only',
      onRemove: () => updateStatusFilter('all'),
    });
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs items={organizationBreadcrumbs('Staff Position Types')} />

      <Card
        title="Staff Position Types"
        subtitle="Manage configurable clinical and operational staff position types"
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
              Add Staff Position Type
            </Button>
          ) : null
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
                  <p className="mt-0.5 text-xs text-muted">Search staff position types by name or department</p>
                </div>
              </div>
              {staffPositionTypesQuery.isFetching ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating
                </span>
              ) : null}
            </div>

            <div className="grid items-end gap-3 lg:grid-cols-[minmax(18rem,1fr)_minmax(12rem,16rem)_minmax(10rem,12rem)]">
              <Input
                id="staff-position-type-search"
                label="Name"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search by name"
                className="h-11"
              />
              <SelectField
                id="staff-position-type-department-filter"
                label="Department"
                value={departmentId}
                onChange={(event) => updateDepartmentId(event.target.value)}
                className="h-11"
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                id="staff-position-type-status-filter"
                label="Status"
                value={statusFilter}
                onChange={(event) => updateStatusFilter(event.target.value as StatusFilter)}
                className="h-11"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>
            </div>

            <FilterSummaryBar chips={filterChips} onClear={clearFilters} />
          </section>

          {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

          {staffPositionTypesQuery.isLoading || departmentsQuery.isLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : null}

          {staffPositionTypesQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getApiErrorMessage(staffPositionTypesQuery.error, 'Staff position types could not be loaded')}
            />
          ) : null}

          {departmentsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getApiErrorMessage(departmentsQuery.error, 'Departments could not be loaded')}
            />
          ) : null}

          {!staffPositionTypesQuery.isLoading &&
          !departmentsQuery.isLoading &&
          !staffPositionTypesQuery.isError &&
          !departmentsQuery.isError &&
          rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
              <p className="font-medium text-foreground">No staff position types found</p>
              <p className="mt-1 text-sm text-muted">Try adjusting the filters or create a new staff position type.</p>
            </div>
          ) : null}

          {!staffPositionTypesQuery.isLoading &&
          !departmentsQuery.isLoading &&
          !staffPositionTypesQuery.isError &&
          !departmentsQuery.isError &&
          rows.length > 0 ? (
            <StaffPositionTypesTable
              rows={rows}
              departments={departments}
              canManage={canManage}
              mutationPending={mutationPending}
              onEdit={openEditModal}
              onDelete={setRecordToDelete}
            />
          ) : null}

          {!staffPositionTypesQuery.isLoading &&
          !departmentsQuery.isLoading &&
          !staffPositionTypesQuery.isError &&
          !departmentsQuery.isError &&
          paginationMeta ? (
            <Pagination
              page={page}
              totalPages={paginationMeta.totalPages}
              total={paginationMeta.total}
              limit={limit}
              loading={staffPositionTypesQuery.isFetching}
              onPageChange={setPage}
              onLimitChange={updateLimit}
            />
          ) : null}
        </div>

        <StaffPositionTypeFormModal
          open={showFormModal}
          departments={departments}
          record={editingRecord}
          loading={createMutation.isPending || updateMutation.isPending}
          submitError={formError}
          onClose={closeFormModal}
          onSubmit={submitForm}
        />

        <DeleteStaffPositionTypeDialog
          record={recordToDelete}
          errorMessage={deleteError}
          loading={deleteMutation.isPending}
          onClose={() => {
            setDeleteError('');
            setRecordToDelete(null);
          }}
          onConfirm={confirmDelete}
        />
      </Card>
    </div>
  );
}
