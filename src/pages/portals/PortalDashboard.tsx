import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';

interface PortalDashboardProps {
  title: string;
  subtitle: string;
  metrics: Array<{ label: string; value: string; tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }>;
  tasks: string[];
}

export default function PortalDashboard({ title, subtitle, metrics, tasks }: PortalDashboardProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="success">Ready</Badge>
            <h2 className="mt-4 text-3xl font-semibold text-foreground">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted">{subtitle}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-4">
            <p className="text-sm text-muted">{metric.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
              <Badge variant={metric.tone}>{metric.tone}</Badge>
            </div>
          </Card>
        ))}
      </section>

      <Card title="Workspace Queue" subtitle="Portal placeholder for the next sprint pages">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <div key={task} className="rounded-lg border border-border bg-surface/70 p-4">
              <p className="text-sm font-medium text-foreground">{task}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
