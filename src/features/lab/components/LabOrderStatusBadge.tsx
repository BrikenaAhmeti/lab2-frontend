import type { LabOrderStatus } from '@/lib/api/lab-api';
import Badge from '@/ui/atoms/Badge';
import { labStatusLabels, labStatusTone } from './labFormat';

export default function LabOrderStatusBadge({ status }: { status: LabOrderStatus }) {
  return <Badge variant={labStatusTone[status]}>{labStatusLabels[status]}</Badge>;
}
