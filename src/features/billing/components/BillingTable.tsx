import { memo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Button from '@/ui/atoms/Button';
import { formatCurrency } from '@/utils/formatters/currency';
import type { BillingView } from '@/lib/api/billing-api';
import BillingStatusBadge from './BillingStatusBadge';
import { canPayBilling, formatBillingDate } from './billingFormat';

interface BillingTableProps {
  rows: BillingView[];
  selectedId: string;
  loading: boolean;
  canManage: boolean;
  markingId: string;
  onSelect: (billing: BillingView) => void;
  onMarkPaid: (billing: BillingView) => void;
}

function BillingTable({ rows, selectedId, loading, canManage, markingId, onSelect, onMarkPaid }: BillingTableProps) {
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
                <div className="flex flex-wrap gap-2">
                  {canManage && canPayBilling(billing) ? (
                    <Button
                      type="button"
                      size="sm"
                      leftIcon={<CheckCircle2 size={14} />}
                      loading={markingId === billing.id}
                      onClick={() => onMarkPaid(billing)}
                    >
                      Mark Paid
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedId === billing.id ? 'primary' : 'secondary'}
                    disabled={loading}
                    onClick={() => onSelect(billing)}
                  >
                    View
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(BillingTable);
