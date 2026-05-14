import { useMemo, useState } from 'react';
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
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { organizationBreadcrumbs } from './organizationBreadcrumbs';

type StatusFilter = 'all' | 'active' | 'inactive';
type FeedbackState = { type: 'success' | 'error'; message: string } | null;

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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffPositionTypeRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<StaffPositionTypeRecord | null>(null);

  const listParams = useMemo(
    () => ({
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [statusFilter]
  );

  const staffPositionTypesQuery = useStaffPositionTypesList(listParams);
  const departmentsQuery = useStaffPositionTypeDepartments();
  const createMutation = useCreateStaffPositionType();
  const updateMutation = useUpdateStaffPositionType();
  const deleteMutation = useDeleteStaffPositionType();

  const rows = staffPositionTypesQuery.data?.items ?? [];
  const departments = departmentsQuery.data ?? [];
  const mutationPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (!canRead) {
    return <Forbidden />;
  }

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

  return (
    <div className="space-y-4">
      <Breadcrumbs items={organizationBreadcrumbs('Staff Position Types')} />

      <Card
        title="Staff Position Types"
        subtitle="Manage configurable clinical and operational staff position types"
        actions={
          canManage ? (
            <Button onClick={openCreateModal}>
              Add Staff Position Type
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[180px] md:justify-start">
            <label htmlFor="staff-position-type-status-filter" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Status</span>
              <select
                id="staff-position-type-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

          {staffPositionTypesQuery.isLoading || departmentsQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-10 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
                <div className="h-12 rounded-lg bg-surface" />
              </div>
            </div>
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
              <p className="mt-1 text-sm text-muted">Create the first staff position type to align staffing workflows with the backend catalog.</p>
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
