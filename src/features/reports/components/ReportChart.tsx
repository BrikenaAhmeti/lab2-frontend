import { useEffect, useMemo, useRef } from 'react';
import type { ReportResult } from '@/lib/api/reports-api';
import { chartKind, firstNumericKey, formatOptionLabel } from '@/features/reports/reportConfig';

export default function ReportChart({ report }: { report: ReportResult }) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const metricKey = firstNumericKey(report.rows);
  const kind = chartKind(report.type, report.groupBy);
  const data = useMemo(
    () =>
      metricKey
        ? report.rows.map((row) => ({
            name: String(row.group ?? '-'),
            value: Number(row[metricKey] ?? 0),
          }))
        : [],
    [metricKey, report.rows]
  );

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    let disposed = false;
    let chart: import('echarts').ECharts | null = null;
    const element = chartRef.current;

    import('echarts').then((echarts) => {
      if (disposed) return;

      chart = echarts.init(element);
      chart.setOption({
        color: ['#0f83a5', '#48b99f', '#f59e0b', '#ef4444'],
        tooltip: { trigger: kind === 'pie' ? 'item' : 'axis' },
        grid: kind === 'pie' ? undefined : { top: 24, right: 18, bottom: 42, left: 52 },
        xAxis: kind === 'pie' ? undefined : { type: 'category', data: data.map((item) => item.name) },
        yAxis: kind === 'pie' ? undefined : { type: 'value' },
        series: [
          kind === 'pie'
            ? {
                name: formatOptionLabel(metricKey),
                type: 'pie',
                radius: ['45%', '70%'],
                data,
              }
            : {
                name: formatOptionLabel(metricKey),
                type: kind,
                smooth: kind === 'line',
                data: data.map((item) => item.value),
              },
        ],
      });
    });

    const resize = () => chart?.resize();
    window.addEventListener('resize', resize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', resize);
      chart?.dispose();
    };
  }, [data, kind, metricKey]);

  if (!metricKey || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
        No chart data returned.
      </div>
    );
  }

  return <div ref={chartRef} className="h-80 w-full" />;
}
