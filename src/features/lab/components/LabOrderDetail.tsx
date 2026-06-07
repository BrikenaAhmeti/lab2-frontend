import { Check, Play } from 'lucide-react';
import type { EnterLabResultsPayload, LabOrderView } from '@/lib/api/lab-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import LabOrderStatusBadge from './LabOrderStatusBadge';
import LabResultFlagBadge from './LabResultFlagBadge';
import ResultEntryForm from './ResultEntryForm';
import { formatLabDateTime, hasAllResults, nextLabStatus } from './labFormat';

interface LabOrderDetailProps {
  order: LabOrderView | null;
  actionLoading?: boolean;
  resultLoading?: boolean;
  error?: string;
  onStatusChange: (order: LabOrderView) => void;
  onSaveResults: (order: LabOrderView, payload: EnterLabResultsPayload) => void;
}

function actionIcon(label: string) {
  if (label.includes('Start')) return <Play className="h-4 w-4" />;
  return <Check className="h-4 w-4" />;
}

export default function LabOrderDetail({
  order,
  actionLoading,
  resultLoading,
  error,
  onStatusChange,
  onSaveResults,
}: LabOrderDetailProps) {
  if (!order) {
    return (
      <aside className="rounded-lg border border-border bg-card p-5 text-sm text-muted">
        Select a lab order to enter results or update status.
      </aside>
    );
  }

  const nextStatus = nextLabStatus(order.status);
  const completeBlocked = order.status === 'IN_PROGRESS' && !hasAllResults(order);

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <LabOrderStatusBadge status={order.status} />
          <Badge variant={order.priority === 'urgent' ? 'danger' : 'neutral'}>
            {order.priority === 'urgent' ? 'Urgent' : 'Normal'}
          </Badge>
        </div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">{order.patient.name}</h2>
        <p className="mt-1 text-sm text-muted">{order.department.name}</p>
      </div>

      <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-1">
        <div>
          <dt className="text-muted">Ordered by</dt>
          <dd className="mt-1 font-medium text-foreground">{order.orderedByStaff.displayName}</dd>
        </div>
        <div>
          <dt className="text-muted">Ordered at</dt>
          <dd className="mt-1 font-medium text-foreground">{formatLabDateTime(order.orderedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Collected at</dt>
          <dd className="mt-1 font-medium text-foreground">{formatLabDateTime(order.collectedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Completed at</dt>
          <dd className="mt-1 font-medium text-foreground">{formatLabDateTime(order.completedAt)}</dd>
        </div>
      </dl>

      {order.notes ? <p className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">{order.notes}</p> : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Tests</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.labTest.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.resultValue ? `${item.resultValue}${item.resultUnit ? ` ${item.resultUnit}` : ''}` : 'No result yet'}
                  </p>
                </div>
                <LabResultFlagBadge flag={item.flag} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? <FeedbackMessage type="error" message={error} /> : null}

      {nextStatus ? (
        <Button
          type="button"
          loading={actionLoading}
          disabled={completeBlocked}
          leftIcon={actionIcon(nextStatus.label)}
          onClick={() => onStatusChange(order)}
        >
          {nextStatus.label}
        </Button>
      ) : null}

      {completeBlocked ? (
        <FeedbackMessage type="error" message="Save results for every test before completing this order." />
      ) : null}

      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' ? (
        <ResultEntryForm order={order} loading={resultLoading} onSave={(payload) => onSaveResults(order, payload)} />
      ) : null}
    </aside>
  );
}
