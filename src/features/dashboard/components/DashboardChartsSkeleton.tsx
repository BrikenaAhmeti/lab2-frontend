import Card from '@/ui/atoms/Card';

function ChartSkeleton() {
  return (
    <Card className="h-80">
      <div className="h-full animate-pulse rounded-lg bg-surface" />
    </Card>
  );
}

export default function DashboardChartsSkeleton() {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
    </section>
  );
}
