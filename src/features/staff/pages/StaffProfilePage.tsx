import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import {
  getApiErrorMessage,
  getStaffName,
  useDeactivateStaff,
  useStaffDetail,
} from '@/features/staff/hooks/useStaff';
import DeactivateStaffDialog from '@/features/staff/components/DeactivateStaffDialog';
import StaffDepartmentsPanel from '@/features/staff/components/StaffDepartmentsPanel';
import StaffExceptionsPanel from '@/features/staff/components/StaffExceptionsPanel';
import StaffInfoPanel from '@/features/staff/components/StaffInfoPanel';
import StaffSchedulePanel from '@/features/staff/components/StaffSchedulePanel';
import StaffTabs from '@/features/staff/components/StaffTabs';
import type { StaffProfileTab } from '@/features/staff/staff.types';
import type { StaffRecord } from '@/lib/api/staff-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

const allowedTabs: StaffProfileTab[] = ['info', 'departments', 'schedule', 'exceptions'];

function canReadStaff(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin']) ||
    hasAnyPermission(permissions, ['staff:read', 'staff:manage', 'staff:manage:all'], 'any')
  );
}

function getTab(value: string | null): StaffProfileTab {
  return allowedTabs.includes(value as StaffProfileTab) ? (value as StaffProfileTab) : 'info';
}

export default function StaffProfilePage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [staffToDeactivate, setStaffToDeactivate] = useState<StaffRecord | null>(null);
  const [deactivateError, setDeactivateError] = useState('');
  const [feedback, setFeedback] = useState('');
  const staffQuery = useStaffDetail(id);
  const deactivateMutation = useDeactivateStaff();
  const activeTab = getTab(searchParams.get('tab'));

  if (!canReadStaff(permissions, roles)) {
    return <Forbidden />;
  }

  const setActiveTab = (tab: StaffProfileTab) => {
    setSearchParams({ tab });
  };

  const confirmDeactivate = async () => {
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
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Staff Directory', to: '/admin/staff' }, { label: 'Profile' }]} />
        <Link to="/admin/staff">
          <Button type="button" variant="secondary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to staff
          </Button>
        </Link>
      </div>

      {staffQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading staff profile...</div> : null}
      {staffQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(staffQuery.error, 'Staff profile could not be loaded')} /> : null}

      {staffQuery.data ? (
        <Card
          title={getStaffName(staffQuery.data)}
          subtitle="Profile, departments, schedules, and exceptions"
          actions={
            <div className="flex flex-wrap gap-2">
              <Link to={`/doctors?staffId=${staffQuery.data.id}&preview=staff`} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">Public preview</Button>
              </Link>
              <Button type="button" variant="danger" onClick={() => setStaffToDeactivate(staffQuery.data)}>
                Deactivate
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {feedback ? <FeedbackMessage type="success" message={feedback} /> : null}
            <StaffTabs activeTab={activeTab} onChange={setActiveTab} />
            {activeTab === 'info' ? <StaffInfoPanel staff={staffQuery.data} /> : null}
            {activeTab === 'departments' ? <StaffDepartmentsPanel staff={staffQuery.data} /> : null}
            {activeTab === 'schedule' ? <StaffSchedulePanel staffId={staffQuery.data.id} /> : null}
            {activeTab === 'exceptions' ? <StaffExceptionsPanel staffId={staffQuery.data.id} /> : null}
          </div>
        </Card>
      ) : null}

      <DeactivateStaffDialog
        staff={staffToDeactivate}
        error={deactivateError}
        loading={deactivateMutation.isPending}
        onClose={() => {
          setDeactivateError('');
          setStaffToDeactivate(null);
        }}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
