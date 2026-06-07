import { Clock } from 'lucide-react';
import {
  formatWorkingHoursLine,
  visibleWorkingHours,
  type WorkingHoursRow,
} from '@/features/settings/workingHours';

interface WorkingHoursSummaryProps {
  rows: WorkingHoursRow[];
  limit?: number;
  emptyText?: string;
}

export default function WorkingHoursSummary({
  rows,
  limit,
  emptyText = 'Hours not configured',
}: WorkingHoursSummaryProps) {
  const openRows = visibleWorkingHours(rows);
  const visibleRows = typeof limit === 'number' ? openRows.slice(0, limit) : openRows;
  const remainingRows = typeof limit === 'number' ? Math.max(0, openRows.length - visibleRows.length) : 0;

  if (openRows.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/55 px-3 py-2 text-sm text-muted">
        <Clock className="h-4 w-4" />
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {visibleRows.map((row) => (
        <div
          key={row.day}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface/55 px-3 py-2 text-sm text-foreground"
        >
          <Clock className="h-4 w-4 text-primary" />
          <span>{formatWorkingHoursLine(row)}</span>
        </div>
      ))}
      {remainingRows > 0 ? <p className="text-xs text-muted">{`+${remainingRows} more open days`}</p> : null}
    </div>
  );
}
