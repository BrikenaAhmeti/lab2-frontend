import { useMemo, useState } from 'react';
import Forbidden from '@/components/common/Forbidden';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { FeedbackStatus } from '@/lib/api/feedback-api';
import AdminFeedbackFilters from '../components/AdminFeedbackFilters';
import FeedbackInboxTable from '../components/FeedbackInboxTable';
import { getFeedbackApiErrorMessage, useFeedbackList, useUpdateFeedbackStatus } from '../hooks/useFeedback';

interface FeedbackInboxPageProps {
  portal: 'admin' | 'doctor';
}

function canReadFeedback(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['feedback:read'], 'any');
}

function canManageFeedback(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['feedback:manage:all'], 'any');
}

export default function FeedbackInboxPage({ portal }: FeedbackInboxPageProps) {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [status, setStatus] = useState<FeedbackStatus | ''>('pending');
  const [staffProfileId, setStaffProfileId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const canRead = canReadFeedback(permissions, roles);
  const canManage = canManageFeedback(permissions, roles);
  const showAdminFilters = portal === 'admin';
  const params = useMemo(
    () => ({
      page: 1,
      limit: 25,
      status: status || undefined,
      staffProfileId: showAdminFilters && staffProfileId ? staffProfileId : undefined,
      departmentId: showAdminFilters && departmentId ? departmentId : undefined,
    }),
    [departmentId, showAdminFilters, staffProfileId, status]
  );
  const feedbackQuery = useFeedbackList(params, canRead);
  const updateMutation = useUpdateFeedbackStatus();
  const rows = feedbackQuery.data?.items ?? [];
  const root = portal === 'admin' ? '/admin' : '/doctor';
  const label = portal === 'admin' ? 'Admin' : 'Doctor';

  if (!canRead) {
    return <Forbidden />;
  }

  const updateStatus = async (id: string, nextStatus: Exclude<FeedbackStatus, 'pending'>) => {
    setMessage(null);

    try {
      await updateMutation.mutateAsync({ id, payload: { status: nextStatus } });
      setMessage({ type: 'success', text: `Feedback marked ${nextStatus}.` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getFeedbackApiErrorMessage(error, 'Feedback status could not be updated.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Feedback' }]} />

      <Card title="Feedback" subtitle="Review appointment feedback and moderation status">
        <div className="space-y-4">
          <div className={showAdminFilters ? 'grid gap-3 lg:grid-cols-3' : 'grid gap-3 sm:max-w-xs'}>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as FeedbackStatus | '')}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            {showAdminFilters ? (
              <AdminFeedbackFilters
                staffProfileId={staffProfileId}
                departmentId={departmentId}
                onStaffChange={setStaffProfileId}
                onDepartmentChange={setDepartmentId}
              />
            ) : null}
          </div>

          {message ? <FeedbackMessage type={message.type} message={message.text} /> : null}

          {feedbackQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading feedback...</div>
          ) : null}

          {feedbackQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getFeedbackApiErrorMessage(feedbackQuery.error, 'Feedback could not be loaded.')}
            />
          ) : null}

          {!feedbackQuery.isLoading && !feedbackQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No feedback found.
            </p>
          ) : null}

          {!feedbackQuery.isLoading && !feedbackQuery.isError && rows.length > 0 ? (
            <FeedbackInboxTable
              rows={rows}
              canManage={canManage}
              loading={updateMutation.isPending}
              onUpdate={updateStatus}
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
