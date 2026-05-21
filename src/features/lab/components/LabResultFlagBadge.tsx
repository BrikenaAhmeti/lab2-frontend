import type { LabResultFlag } from '@/lib/api/lab-api';
import Badge from '@/ui/atoms/Badge';
import { flagLabels, flagTone } from './labFormat';

export default function LabResultFlagBadge({ flag }: { flag: LabResultFlag }) {
  return <Badge variant={flagTone[flag]}>{flagLabels[flag]}</Badge>;
}
