import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, BriefcaseMedical, Building2, Eye, Mail, UserX } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import {
  getApiErrorMessage,
  getStaffDepartmentName,
  getStaffEmail,
  getStaffName,
  getStaffStatus,
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
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
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

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s+/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MS';
}

function statusVariant(status: string): 'success' | 'neutral' {
  return status.toLowerCase() === 'active' ? 'success' : 'neutral';
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
  const staff = staffQuery.data;
  const staffName = staff ? getStaffName(staff) : '';
  const staffStatus = staff ? getStaffStatus(staff) : '';
  const primaryDepartment = staff?.departments?.find((department) => department.isPrimary) ?? staff?.departments?.[0];
  const primaryDepartmentName = primaryDepartment ? getStaffDepartmentName(primaryDepartment) : null;

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

      {staff ? (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
            <div className="grid gap-5 border-b border-border bg-surface/50 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xl font-semibold text-primary">
                  {getInitials(staffName)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold tracking-normal text-foreground">{staffName}</h2>
                    <Badge variant={statusVariant(staffStatus)}>{staffStatus}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {[staff.positionType?.name, staff.specialization].filter(Boolean).join(' · ') || 'Staff profile'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                      <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
                      {getStaffEmail(staff)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                      <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      {primaryDepartmentName ?? 'No department'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                      <BriefcaseMedical className="h-4 w-4 text-primary" aria-hidden="true" />
                      {staff.isPublicProfile ? 'Public profile' : 'Internal profile'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link to={`/doctors?staffId=${staff.id}&preview=staff`} target="_blank" rel="noreferrer">
                  <Button type="button" variant="secondary" leftIcon={<Eye className="h-4 w-4" />}>
                    Public preview
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  leftIcon={<UserX className="h-4 w-4" />}
                  onClick={() => setStaffToDeactivate(staff)}
                >
                  Deactivate
                </Button>
              </div>
            </div>
            <div className="p-4">
              <StaffTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>
          </section>

          {feedback ? <FeedbackMessage type="success" message={feedback} /> : null}
          {activeTab === 'info' ? <StaffInfoPanel staff={staff} /> : null}
          {activeTab === 'departments' ? <StaffDepartmentsPanel staff={staff} /> : null}
          {activeTab === 'schedule' ? <StaffSchedulePanel staffId={staff.id} /> : null}
          {activeTab === 'exceptions' ? <StaffExceptionsPanel staffId={staff.id} /> : null}
        </div>
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
