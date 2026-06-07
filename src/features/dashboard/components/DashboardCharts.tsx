import { useEffect, useMemo, useRef } from 'react';
import { LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import Card from '@/ui/atoms/Card';
import DashboardChartsSkeleton from './DashboardChartsSkeleton';
import { formatCurrency } from '@/utils/formatters/currency';
import type { DashboardStats } from '../dashboardTypes';

echarts.use([PieChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

function chartDateLabel(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function EChart({ option, label }: { option: EChartsCoreOption; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = echarts.init(ref.current);
    chart.setOption(option);

    const resize = () => chart.resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [option]);

  return <div ref={ref} className="h-72 w-full" role="img" aria-label={label} />;
}

export default function DashboardCharts({ stats, isLoading }: { stats?: DashboardStats; isLoading: boolean }) {
  const appointmentOption = useMemo<EChartsCoreOption>(() => {
    const appointments = stats?.appointments;
    const data = [
      { name: 'Scheduled', value: appointments?.scheduled ?? 0 },
      { name: 'Checked in', value: appointments?.checkedIn ?? 0 },
      { name: 'Completed', value: appointments?.completed ?? 0 },
      { name: 'Cancelled', value: appointments?.cancelled ?? 0 },
      { name: 'No-show', value: appointments?.noShow ?? 0 },
    ];

    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      color: ['#1687A8', '#2FA66A', '#F59E0B', '#EF4444', '#64748B'],
      series: [
        {
          type: 'pie',
          radius: ['46%', '70%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          data,
        },
      ],
    };
  }, [stats]);

  const revenueOption = useMemo<EChartsCoreOption>(() => {
    const trend = stats?.revenueTrend ?? [];

    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: string | number) => formatCurrency(Number(value)),
      },
      color: ['#1687A8'],
      grid: { left: 12, right: 12, bottom: 24, top: 24, containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trend.map((item) => chartDateLabel(item.date)),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => formatCurrency(value).replace('.00', ''),
        },
      },
      series: [
        {
          name: 'Revenue',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.14 },
          data: trend.map((item) => item.total),
        },
      ],
    };
  }, [stats]);

  if (isLoading) {
    return <DashboardChartsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card title="Appointments by Status" subtitle="Today">
        <EChart option={appointmentOption} label="Appointments by status chart" />
      </Card>
      <Card title="Revenue Trend" subtitle="Last 7 days">
        <EChart option={revenueOption} label="Revenue trend chart" />
      </Card>
    </section>
  );
}
