import type { ReportSummaryMetric } from '@/lib/api/reports-api';
import { formatReportValue } from '@/features/reports/reportConfig';

export default function ReportSummaryStrip({ summary }: { summary: ReportSummaryMetric[] }) {
  if (summary.length === 0) return null;

  return (
    <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {summary.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-border bg-surface/60 p-4">
          <dt className="text-xs font-medium uppercase text-muted">{metric.label}</dt>
          <dd className="mt-2 text-xl font-semibold text-foreground">{formatReportValue(metric.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
