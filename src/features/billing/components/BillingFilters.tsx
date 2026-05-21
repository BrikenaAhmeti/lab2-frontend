import Input from '@/ui/atoms/Input';
import { billingStatuses, type BillingStatus } from '@/lib/api/billing-api';
import { billingStatusLabels } from './billingFormat';

interface BillingFiltersProps {
  status: BillingStatus | 'all';
  from: string;
  to: string;
  onStatusChange: (value: BillingStatus | 'all') => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export default function BillingFilters({
  status,
  from,
  to,
  onStatusChange,
  onFromChange,
  onToChange,
}: BillingFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[220px_180px_180px]">
      <label htmlFor="billing-status-filter" className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Status</span>
        <select
          id="billing-status-filter"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as BillingStatus | 'all')}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All statuses</option>
          {billingStatuses.map((item) => (
            <option key={item} value={item}>
              {billingStatusLabels[item]}
            </option>
          ))}
        </select>
      </label>
      <Input id="billing-from-filter" label="From" type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
      <Input id="billing-to-filter" label="To" type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
    </div>
  );
}
