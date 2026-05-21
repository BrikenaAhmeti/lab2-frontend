import type { LabOrderPriority, LabOrderStatus, LabOrderStatusInput, LabOrderView, LabResultFlag } from '@/lib/api/lab-api';

const criticalMultiplier = 3;

export const labStatusLabels: Record<LabOrderStatus, string> = {
  PENDING: 'Pending',
  COLLECTED: 'Sample Collected',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const labStatusTone: Record<LabOrderStatus, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  COLLECTED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const flagLabels: Record<LabResultFlag, string> = {
  pending: 'Pending',
  normal: 'Normal',
  abnormal: 'Abnormal',
  critical: 'Critical',
  unavailable: 'No range',
};

export const flagTone: Record<LabResultFlag, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  pending: 'neutral',
  normal: 'success',
  abnormal: 'warning',
  critical: 'danger',
  unavailable: 'neutral',
};

const priorityRank: Record<LabOrderPriority, number> = {
  urgent: 0,
  normal: 1,
};

function extractNumbers(value: string) {
  return [...value.matchAll(/-?\d+(?:\.\d+)?/g)]
    .map((match) => Number(match[0]))
    .filter((item) => Number.isFinite(item));
}

function parseReferenceRange(referenceRange?: string | null) {
  if (!referenceRange) return null;
  const values = extractNumbers(referenceRange);
  if (values.length < 2) return null;
  const [first, second] = values;

  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
  };
}

function isCriticalValue(value: number, min: number, max: number) {
  if (min > 0 && max > 0) {
    return value < min / criticalMultiplier || value > max * criticalMultiplier;
  }

  const width = Math.max(max - min, 1);
  return value < min - width * (criticalMultiplier - 1) || value > max + width * (criticalMultiplier - 1);
}

export function previewLabResultFlag(resultValue: string, referenceRange?: string | null): LabResultFlag {
  if (!resultValue.trim()) return 'pending';

  const value = extractNumbers(resultValue)[0];
  const range = parseReferenceRange(referenceRange);

  if (typeof value !== 'number' || !range) return 'unavailable';
  if (value < range.min || value > range.max) return isCriticalValue(value, range.min, range.max) ? 'critical' : 'abnormal';

  return 'normal';
}

export function formatLabDateTime(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
    date: start.toISOString().slice(0, 10),
  };
}

export function getDateRange(value: string) {
  const start = new Date(`${value}T00:00:00`);
  const end = new Date(`${value}T23:59:59.999`);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function nextLabStatus(status: LabOrderStatus): { label: string; status: LabOrderStatusInput } | null {
  if (status === 'PENDING') return { label: 'Mark Sample Collected', status: 'sample_collected' };
  if (status === 'COLLECTED') return { label: 'Start Processing', status: 'in_progress' };
  if (status === 'IN_PROGRESS') return { label: 'Complete Order', status: 'completed' };
  return null;
}

export function hasAllResults(order: LabOrderView) {
  return order.items.every((item) => Boolean(item.resultValue?.trim()));
}

export function sortLabOrders(orders: LabOrderView[]) {
  return [...orders].sort((left, right) => {
    const leftPriority = priorityRank[left.priority ?? 'normal'];
    const rightPriority = priorityRank[right.priority ?? 'normal'];
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return new Date(left.orderedAt).getTime() - new Date(right.orderedAt).getTime();
  });
}
