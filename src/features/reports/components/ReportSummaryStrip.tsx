import { memo } from 'react';
import type { ReportSummaryMetric } from '@/lib/api/reports-api';
import { formatReportValue } from '@/features/reports/reportConfig';

const dividerClasses = ['bg-med-500', 'bg-cobalt-500', 'bg-accent', 'bg-warning'];

function ReportSummaryStrip({ summary }: { summary: ReportSummaryMetric[] }) {
  if (summary.length === 0) return null;

  return (
    <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {summary.map((metric, index) => (
        <div key={metric.label} className="overflow-hidden rounded-lg border border-border bg-surface/60">
          <div className={`h-1 ${dividerClasses[index % dividerClasses.length]}`} aria-hidden="true" />
          <div className="p-4">
            <dt className="text-xs font-medium uppercase text-muted">{metric.label}</dt>
            <dd className="mt-2 text-xl font-semibold text-foreground">{formatReportValue(metric.value)}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export default memo(ReportSummaryStrip);
