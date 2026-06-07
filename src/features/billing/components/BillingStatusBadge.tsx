import Badge from '@/ui/atoms/Badge';
import type { BillingStatus } from '@/lib/api/billing-api';
import { billingStatusLabels, billingStatusTone } from './billingFormat';

export default function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return <Badge variant={billingStatusTone[status]}>{billingStatusLabels[status]}</Badge>;
}
