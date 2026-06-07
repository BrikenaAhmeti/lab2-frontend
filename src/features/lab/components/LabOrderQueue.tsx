import clsx from 'clsx';
import { memo, type ReactNode } from 'react';
import type { LabOrderView } from '@/lib/api/lab-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import { TableSkeleton } from '@/ui/atoms/Skeleton';
import LabOrderStatusBadge from './LabOrderStatusBadge';
import { formatLabDateTime } from './labFormat';

interface LabOrderQueueProps {
  title: string;
  orders: LabOrderView[];
  selectedId?: string;
  loading?: boolean;
  emptyText: string;
  subtitle?: string;
  actions?: ReactNode;
  onSelect: (order: LabOrderView) => void;
}

function criticalCount(order: LabOrderView) {
  return order.items.filter((item) => item.flag === 'critical' || item.isCritical).length;
}

function testNames(order: LabOrderView) {
  return order.items.map((item) => item.labTest.name).join(', ');
}

function LabOrderQueue({
  title,
  orders,
  selectedId,
  loading,
  emptyText,
  subtitle,
  actions,
  onSelect,
}: LabOrderQueueProps) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <Badge>{orders.length}</Badge>
          </div>
          {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>

      {loading ? <div className="p-4"><TableSkeleton rows={3} columns={5} /></div> : null}

      {!loading && orders.length === 0 ? <p className="px-4 py-6 text-sm text-muted">{emptyText}</p> : null}

      {!loading && orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Tests</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Ordered</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const critical = criticalCount(order);

                return (
                  <tr
                    key={order.id}
                    className={clsx('border-t border-border align-top', selectedId === order.id && 'bg-primary/5')}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{order.patient.name}</p>
                      <p className="mt-1 text-xs text-muted">{order.patient.phone ?? order.patient.email ?? 'No contact'}</p>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <p className="line-clamp-2 text-foreground">{testNames(order)}</p>
                      <p className="mt-1 text-xs text-muted">{order.department.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <LabOrderStatusBadge status={order.status} />
                        <Badge variant={order.priority === 'urgent' ? 'danger' : 'neutral'}>
                          {order.priority === 'urgent' ? 'Urgent' : 'Normal'}
                        </Badge>
                        {critical > 0 ? <Badge variant="danger">{`${critical} critical`}</Badge> : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatLabDateTime(order.orderedAt)}</td>
                    <td className="px-4 py-3">
                      <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(order)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default memo(LabOrderQueue);
