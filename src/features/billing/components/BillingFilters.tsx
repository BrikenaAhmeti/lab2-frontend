import Input from '@/ui/atoms/Input';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';
import { billingStatuses, type BillingStatus } from '@/lib/api/billing-api';
import { billingStatusLabels } from './billingFormat';

interface BillingFiltersProps {
  patientSearch: string;
  status: BillingStatus | 'all';
  from: string;
  to: string;
  onPatientSearchChange: (value: string) => void;
  onStatusChange: (value: BillingStatus | 'all') => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

export default function BillingFilters({
  patientSearch,
  status,
  from,
  to,
  onPatientSearchChange,
  onStatusChange,
  onFromChange,
  onToChange,
}: BillingFiltersProps) {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_220px_180px_180px]">
      <Input
        id="billing-patient-filter"
        label="Patient"
        value={patientSearch}
        onChange={(event) => onPatientSearchChange(event.target.value)}
        placeholder="Search patient name, email, or phone..."
      />
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
      <CalendarDatePicker id="billing-from-filter" label="From" value={from} onChange={onFromChange} />
      <CalendarDatePicker id="billing-to-filter" label="To" value={to} min={from || undefined} onChange={onToChange} />
    </div>
  );
}
