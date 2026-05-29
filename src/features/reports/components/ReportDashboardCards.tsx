import { memo, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { reportsApi, type ReportFilters, type ReportType } from '@/lib/api/reports-api';
import { reportsQueryKey } from '@/features/reports/hooks/useReports';
import { formatReportValue, reportSnapshotRange } from '@/features/reports/reportConfig';

interface SnapshotConfig {
  key: string;
  title: string;
  type: ReportType;
  filters: ReportFilters;
  metric: string;
}

function ReportDashboardCards({ enabled }: { enabled: boolean }) {
  const snapshots = useMemo<SnapshotConfig[]>(() => {
    const today = reportSnapshotRange('today');
    const week = reportSnapshotRange('week');
    const month = reportSnapshotRange('month');

    return [
      {
        key: 'appointments-today',
        title: "Today's Appointments",
        type: 'appointments',
        filters: { ...today, groupBy: 'status' },
        metric: 'Total appointments',
      },
      {
        key: 'revenue-week',
        title: "This Week's Revenue",
        type: 'financial',
        filters: { ...week, groupBy: 'day' },
        metric: 'Total paid',
      },
      {
        key: 'low-stock',
        title: 'Low Stock',
        type: 'inventory',
        filters: { ...month, groupBy: 'category' },
        metric: 'Low stock items',
      },
      {
        key: 'pending-labs',
        title: 'Pending Lab Orders',
        type: 'clinical',
        filters: { ...month, groupBy: 'category', status: 'PENDING' },
        metric: 'Lab orders',
      },
    ];
  }, []);

  const results = useQueries({
    queries: snapshots.map((snapshot) => ({
      queryKey: reportsQueryKey.snapshot(snapshot.key, snapshot.type, snapshot.filters),
      queryFn: () => reportsApi.generateReport(snapshot.type, snapshot.filters),
      enabled,
      refetchInterval: 60000,
      retry: false,
    })),
  });

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {snapshots.map((snapshot, index) => {
        const result = results[index];
        const metric = result.data?.summary.find((item) => item.label === snapshot.metric) ?? result.data?.summary[0];

        return (
          <article key={snapshot.key} className="panel p-4">
            <p className="text-xs font-medium uppercase text-muted">{snapshot.title}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.isLoading ? '...' : result.isError ? '-' : formatReportValue(metric?.value ?? null)}
            </p>
          </article>
        );
      })}
    </section>
  );
}

export default memo(ReportDashboardCards);
