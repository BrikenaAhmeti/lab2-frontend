import { CalendarCheck, ClipboardList, FlaskConical, PackageSearch, Stethoscope, WalletCards } from 'lucide-react';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import { formatCurrency } from '@/utils/formatters/currency';
import type { DashboardStats } from '../dashboardTypes';

interface StatCard {
  label: string;
  value: string;
  detail: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  icon: typeof CalendarCheck;
}

function StatSkeleton() {
  return (
    <Card className="p-4">
      <div className="h-4 w-24 animate-pulse rounded bg-surface" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-surface" />
      <div className="mt-4 h-5 w-32 animate-pulse rounded bg-surface" />
    </Card>
  );
}

function buildCards(stats: DashboardStats): StatCard[] {
  return [
    {
      label: "Today's appointments",
      value: String(stats.appointments.total),
      detail: `${stats.appointments.scheduled} scheduled, ${stats.appointments.checkedIn} checked in`,
      tone: 'info',
      icon: CalendarCheck,
    },
    {
      label: 'Checked-in patients',
      value: String(stats.checkedInPatients),
      detail: 'Currently in facility',
      tone: 'success',
      icon: Stethoscope,
    },
    {
      label: 'Pending lab orders',
      value: String(stats.pendingLabOrders),
      detail: 'Awaiting processing',
      tone: 'warning',
      icon: FlaskConical,
    },
    {
      label: 'Low stock items',
      value: String(stats.lowStockItems),
      detail: 'Needs inventory action',
      tone: stats.lowStockItems > 0 ? 'danger' : 'success',
      icon: PackageSearch,
    },
    {
      label: 'Revenue today',
      value: formatCurrency(stats.revenue.today),
      detail: 'Payments recorded today',
      tone: 'success',
      icon: WalletCards,
    },
    {
      label: 'Revenue week / month',
      value: formatCurrency(stats.revenue.week),
      detail: `${formatCurrency(stats.revenue.month)} this month`,
      tone: 'neutral',
      icon: ClipboardList,
    },
  ];
}

export default function StatsCards({ stats, isLoading }: { stats?: DashboardStats; isLoading: boolean }) {
  if (isLoading) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <StatSkeleton key={index} />
        ))}
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {buildCards(stats).map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="overflow-hidden p-0">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{card.label}</p>
                  <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{card.value}</p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <Badge variant={card.tone} className="mt-4 max-w-full">
                {card.detail}
              </Badge>
            </div>
          </Card>
        );
      })}
    </section>
  );
}
