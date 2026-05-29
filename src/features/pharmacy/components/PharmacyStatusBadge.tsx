import type { PharmacyStatus } from '@/lib/api/pharmacy-api';
import Badge from '@/ui/atoms/Badge';
import { pharmacyStatusLabels, pharmacyStatusTone } from './pharmacyFormat';

export default function PharmacyStatusBadge({ status }: { status: PharmacyStatus }) {
  return <Badge variant={pharmacyStatusTone[status]}>{pharmacyStatusLabels[status]}</Badge>;
}
