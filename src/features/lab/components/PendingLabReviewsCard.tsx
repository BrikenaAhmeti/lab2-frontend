import { Link } from 'react-router-dom';
import type { LabOrderView } from '@/lib/api/lab-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import LabResultFlagBadge from './LabResultFlagBadge';
import { formatLabDateTime } from './labFormat';

function criticalCount(order: LabOrderView) {
  return order.items.filter((item) => item.flag === 'critical' || item.isCritical).length;
}

export default function PendingLabReviewsCard({
  orders,
  loading,
  error,
}: {
  orders: LabOrderView[];
  loading?: boolean;
  error?: boolean;
}) {
  return (
    <Card title="Pending Lab Reviews" subtitle="Completed lab orders waiting for patient release">
      {loading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading lab reviews...</div> : null}

      {error ? <FeedbackMessage type="error" message="Pending lab reviews could not be loaded" /> : null}

      {!loading && !error && orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
          No lab results are waiting for review.
        </div>
      ) : null}

      <ol className="space-y-3">
        {orders.map((order) => {
          const critical = criticalCount(order);

          return (
            <li key={order.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={order.priority === 'urgent' ? 'danger' : 'neutral'}>
                      {order.priority === 'urgent' ? 'Urgent' : 'Normal'}
                    </Badge>
                    {critical > 0 ? <Badge variant="danger">{`${critical} critical`}</Badge> : null}
                    {order.items[0] ? <LabResultFlagBadge flag={order.items[0].flag} /> : null}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{order.patient.name}</p>
                    <p className="mt-1 text-sm text-muted">{order.items.map((item) => item.labTest.name).join(', ')}</p>
                    <p className="mt-1 text-sm text-muted">{formatLabDateTime(order.completedAt)}</p>
                  </div>
                </div>
                <Link to={`/doctor/lab-reviews/${order.id}`}>
                  <Button type="button" size="sm">
                    Review Results
                  </Button>
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
