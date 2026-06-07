import { memo, useMemo } from 'react';
import type { LabOrderStatus, LabOrderView } from '@/lib/api/lab-api';

const stats: Array<{ label: string; status?: LabOrderStatus }> = [
  { label: 'Total Today' },
  { label: 'Completed Today', status: 'COMPLETED' },
  { label: 'Pending Today', status: 'PENDING' },
  { label: 'In Progress Today', status: 'IN_PROGRESS' },
];

function LabStatsCards({ orders, loading }: { orders: LabOrderView[]; loading?: boolean }) {
  const counts = useMemo(
    () =>
      stats.reduce<Record<string, number>>((acc, stat) => {
        acc[stat.label] = stat.status ? orders.filter((order) => order.status === stat.status).length : orders.length;
        return acc;
      }, {}),
    [orders]
  );

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        return (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{loading ? '...' : counts[stat.label]}</p>
          </div>
        );
      })}
    </section>
  );
}

export default memo(LabStatsCards);
