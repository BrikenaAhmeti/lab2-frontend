import { formatMoney } from '@/config/currencies';
import { useUsers } from '@/hooks/useUsers';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';

const stats = [
  { label: 'Revenue Today', value: formatMoney(12345.67), trend: '+6.2%' },
  { label: 'Appointments', value: '148', trend: '+12' },
  { label: 'Avg. Wait Time', value: '13 min', trend: '-4 min' },
  { label: 'Satisfaction', value: '96.4%', trend: '+1.1%' },
];

const recentActivity = [
  { patient: 'Emma Rivera', event: 'Follow-up completed', status: 'success' as const, time: '8 min ago' },
  { patient: 'Miles Jordan', event: 'Lab review pending', status: 'warning' as const, time: '22 min ago' },
  { patient: 'Nadia Foster', event: 'Billing issue flagged', status: 'danger' as const, time: '36 min ago' },
];

const Home = () => {
  const { data, isLoading, error } = useUsers();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-sm text-muted">{item.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
              <Badge variant="info">{item.trend}</Badge>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Operations Snapshot"
          subtitle="Live activity across patient workflows"
          actions={<Button size="sm">Export</Button>}
        >
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr key={activity.patient} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">{activity.patient}</td>
                    <td className="px-4 py-3 text-muted">{activity.event}</td>
                    <td className="px-4 py-3">
                      <Badge variant={activity.status}>{activity.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Clinical Team" subtitle="Fetched with TanStack Query">
          {isLoading && <p className="text-sm text-muted">Loading team members...</p>}
          {error && <p className="text-sm text-danger">Error loading users.</p>}
          {!isLoading && !error && (
            <ul className="space-y-2">
              {data?.slice(0, 6).map((u: any) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface/70 px-3 py-2"
                >
                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                  <Badge variant="neutral">Online</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
};

export default Home;
