import { Activity, CalendarCheck, CreditCard, FlaskConical, PackageSearch, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Card from '@/ui/atoms/Card';
import type { DashboardActivity } from '../dashboardTypes';

function relativeTime(value: string) {
  const then = new Date(value).getTime();
  const now = Date.now();
  const seconds = Math.round((then - now) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(days) >= 1) return formatter.format(days, 'day');
  if (Math.abs(hours) >= 1) return formatter.format(hours, 'hour');
  if (Math.abs(minutes) >= 1) return formatter.format(minutes, 'minute');
  return formatter.format(seconds, 'second');
}

function iconFor(actionType: string) {
  const action = actionType.toLowerCase();

  if (action.includes('appointment')) return CalendarCheck;
  if (action.includes('lab')) return FlaskConical;
  if (action.includes('payment') || action.includes('billing')) return CreditCard;
  if (action.includes('stock') || action.includes('inventory')) return PackageSearch;
  if (action.includes('patient') || action.includes('staff')) return UserRound;
  return Activity;
}

function labelFor(actionType: string) {
  return actionType
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ActivitySkeleton() {
  return (
    <li className="rounded-lg border border-border bg-surface/60 p-4">
      <div className="h-4 w-3/4 animate-pulse rounded bg-card" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-card" />
    </li>
  );
}

export default function ActivityFeed({
  items,
  isLoading,
}: {
  items: DashboardActivity[];
  isLoading: boolean;
}) {
  return (
    <Card title="Recent Activity" subtitle="Last 20 facility-wide actions">
      {isLoading && (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <ActivitySkeleton key={index} />
          ))}
        </ul>
      )}

      {!isLoading && items.length === 0 && (
        <p className="rounded-lg border border-border bg-surface/60 p-4 text-sm text-muted">No activity yet.</p>
      )}

      {!isLoading && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => {
            const Icon = iconFor(item.actionType);

            return (
              <li key={item.id} className="rounded-lg border border-border bg-surface/60 p-4">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-card text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{labelFor(item.actionType)}</Badge>
                      <time className="text-xs text-muted" dateTime={item.createdAt}>
                        {relativeTime(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{item.description}</p>
                    <p className="mt-1 text-sm text-muted">by {item.actorName}</p>
                    {item.entityLink && (
                      <Link className="mt-2 inline-flex text-sm font-medium text-primary hover:underline" to={item.entityLink}>
                        {item.entityLabel ?? 'Open record'}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
