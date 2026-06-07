import { memo } from 'react';
import Button from '@/ui/atoms/Button';
import { formatCurrency } from '@/utils/formatters/currency';
import type { BillingView } from '@/lib/api/billing-api';
import BillingStatusBadge from './BillingStatusBadge';
import { formatBillingDate } from './billingFormat';

interface BillingTableProps {
  rows: BillingView[];
  selectedId: string;
  loading: boolean;
  onSelect: (billing: BillingView) => void;
}

function BillingTable({ rows, selectedId, loading, onSelect }: BillingTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Patient</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Outstanding</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((billing) => (
            <tr key={billing.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{billing.patient.name}</p>
                <p className="mt-1 text-xs text-muted">{billing.billingNumber}</p>
              </td>
              <td className="px-4 py-3">{formatCurrency(Number(billing.totalAmount))}</td>
              <td className="px-4 py-3">
                <BillingStatusBadge status={billing.status} />
              </td>
              <td className="px-4 py-3">{formatBillingDate(billing.issuedAt)}</td>
              <td className="px-4 py-3">{formatCurrency(Number(billing.outstandingAmount))}</td>
              <td className="px-4 py-3">
                <Button
                  type="button"
                  size="sm"
                  variant={selectedId === billing.id ? 'primary' : 'secondary'}
                  disabled={loading}
                  onClick={() => onSelect(billing)}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(BillingTable);
