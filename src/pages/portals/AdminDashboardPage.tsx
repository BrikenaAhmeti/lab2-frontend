import { Suspense, lazy } from 'react';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import StatsCards from '@/features/dashboard/components/StatsCards';
import ActivityFeed from '@/features/dashboard/components/ActivityFeed';
import DashboardChartsSkeleton from '@/features/dashboard/components/DashboardChartsSkeleton';
import { useDashboardActivity, useDashboardStats } from '@/features/dashboard/useDashboard';

const DashboardCharts = lazy(() => import('@/features/dashboard/components/DashboardCharts'));

function updatedLabel(value?: string | null) {
  if (!value) return 'Live data';

  return `Updated ${new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))}`;
}

export default function AdminDashboardPage() {
  const statsQuery = useDashboardStats();
  const activityQuery = useDashboardActivity();
  const activity = activityQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="success">Live Dashboard</Badge>
              <span className="text-sm text-muted">{updatedLabel(statsQuery.data?.updatedAt)}</span>
            </div>
            <h2 className="text-3xl font-semibold text-foreground">Facility Command Center</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Real-time appointments, lab, inventory, billing, and facility activity for admins.
            </p>
          </div>
        </div>
      </section>

      {statsQuery.isError && (
        <FeedbackMessage type="error" message="Dashboard stats could not be loaded." />
      )}

      <StatsCards stats={statsQuery.data} isLoading={statsQuery.isLoading} />

      <Suspense fallback={<DashboardChartsSkeleton />}>
        <DashboardCharts stats={statsQuery.data} isLoading={statsQuery.isLoading} />
      </Suspense>

      {activityQuery.isError && (
        <FeedbackMessage type="error" message="Recent activity could not be loaded." />
      )}

      <ActivityFeed items={activity} isLoading={activityQuery.isLoading} />
    </div>
  );
}
