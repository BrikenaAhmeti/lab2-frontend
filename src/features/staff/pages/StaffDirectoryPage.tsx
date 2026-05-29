import { useCallback, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import LazyImportWizard from '@/components/import/LazyImportWizard';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import {
  getApiErrorMessage,
  useDeactivateStaff,
  useStaffDepartments,
  useStaffList,
  useStaffPositionTypeOptions,
} from '@/features/staff/hooks/useStaff';
import DeactivateStaffDialog from '@/features/staff/components/DeactivateStaffDialog';
import StaffDirectoryTable from '@/features/staff/components/StaffDirectoryTable';
import type { StaffRecord } from '@/lib/api/staff-api';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { TableSkeleton } from '@/ui/atoms/Skeleton';

type StaffStatus = 'all' | 'active' | 'inactive';

function canReadStaff(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin']) ||
    hasAnyPermission(permissions, ['staff:read', 'staff:manage', 'staff:manage:all'], 'any')
  );
}

export default function StaffDirectoryPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionTypeId, setPositionTypeId] = useState('');
  const [status, setStatus] = useState<StaffStatus>('all');
  const [staffToDeactivate, setStaffToDeactivate] = useState<StaffRecord | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');
  const [feedback, setFeedback] = useState('');
  const deactivateMutation = useDeactivateStaff();
  const canManage =
    hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['staff:manage'], 'any');

  const params = useMemo(
    () => ({
      page: 1,
      limit: 25,
      search: search || undefined,
      departmentId: departmentId || undefined,
      positionTypeId: positionTypeId || undefined,
      status: status === 'all' ? undefined : status,
    }),
    [departmentId, positionTypeId, search, status]
  );

  const staffQuery = useStaffList(params);
  const departmentsQuery = useStaffDepartments();
  const positionTypesQuery = useStaffPositionTypeOptions();
  const rows = staffQuery.data?.items ?? [];

  if (!canReadStaff(permissions, roles)) {
    return <Forbidden />;
  }

  const openImportWizard = useCallback(() => setShowImportWizard(true), []);
  const closeImportWizard = useCallback(() => setShowImportWizard(false), []);
  const closeDeactivateDialog = useCallback(() => {
    setDeactivateError('');
    setStaffToDeactivate(null);
  }, []);
  const handleImportCompleted = useCallback(() => {
    setFeedback('Staff imported successfully');
    void staffQuery.refetch();
  }, [staffQuery.refetch]);

  const confirmDeactivate = useCallback(async () => {
    if (!staffToDeactivate) return;

    setDeactivateError('');
    setFeedback('');

    try {
      await deactivateMutation.mutateAsync(staffToDeactivate.id);
      setFeedback('Staff member deactivated successfully');
      setStaffToDeactivate(null);
    } catch (error) {
      setDeactivateError(getApiErrorMessage(error, 'Staff member could not be deactivated'));
    }
  }, [deactivateMutation, staffToDeactivate]);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Staff Management' }, { label: 'Staff Directory' }]} />

      <Card
        title="Staff Directory"
        subtitle="Search staff profiles and open schedule management"
        actions={
          canManage ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={openImportWizard}
            >
              Import
            </Button>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_160px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff..." />
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All departments</option>
              {(departmentsQuery.data ?? []).map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <select
              value={positionTypeId}
              onChange={(event) => setPositionTypeId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All positions</option>
              {(positionTypesQuery.data ?? []).map((positionType) => (
                <option key={positionType.id} value={positionType.id}>{positionType.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StaffStatus)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {feedback ? <FeedbackMessage type="success" message={feedback} /> : null}
          {staffQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(staffQuery.error, 'Staff could not be loaded')} /> : null}

          {staffQuery.isLoading ? <TableSkeleton rows={5} columns={5} /> : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No staff members found.
            </p>
          ) : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length > 0 ? (
            <StaffDirectoryTable rows={rows} loading={deactivateMutation.isPending} onDeactivate={setStaffToDeactivate} />
          ) : null}
        </div>
      </Card>

      <DeactivateStaffDialog
        staff={staffToDeactivate}
        error={deactivateError}
        loading={deactivateMutation.isPending}
        onClose={closeDeactivateDialog}
        onConfirm={confirmDeactivate}
      />
      <LazyImportWizard
        open={showImportWizard}
        entity="staff"
        title="Import Staff"
        onClose={closeImportWizard}
        onCompleted={handleImportCompleted}
      />
    </div>
  );
}
