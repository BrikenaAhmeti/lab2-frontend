import { Suspense, lazy } from 'react';
import Badge from '@/ui/atoms/Badge';
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
  const showStats = !statsQuery.isError;
  const showActivity = !activityQuery.isError;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
        <div className="border-l-4 border-primary px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="success">Live Dashboard</Badge>
                <span className="text-xs font-medium text-muted">{updatedLabel(statsQuery.data?.updatedAt)}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Facility Command Center</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Real-time appointments, lab, inventory, billing, and facility activity for admins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showStats && <StatsCards stats={statsQuery.data} isLoading={statsQuery.isLoading} />}

      {showStats && (
        <Suspense fallback={<DashboardChartsSkeleton />}>
          <DashboardCharts stats={statsQuery.data} isLoading={statsQuery.isLoading} />
        </Suspense>
      )}

      {showActivity && <ActivityFeed items={activity} isLoading={activityQuery.isLoading} />}
    </div>
  );
}
