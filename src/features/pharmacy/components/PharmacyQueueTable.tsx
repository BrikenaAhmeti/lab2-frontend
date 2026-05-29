import clsx from 'clsx';
import { memo } from 'react';
import type { PharmacyQueueView } from '@/lib/api/pharmacy-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import {
  formatMedicationSummary,
  formatPharmacyDateTime,
  normalizeAllergies,
} from './pharmacyFormat';
import PharmacyStatusBadge from './PharmacyStatusBadge';
import { TableSkeleton } from '@/ui/atoms/Skeleton';

interface PharmacyQueueTableProps {
  queues: PharmacyQueueView[];
  selectedId?: string;
  loading?: boolean;
  emptyText: string;
  onSelect: (queue: PharmacyQueueView) => void;
}

function PharmacyQueueTable({
  queues,
  selectedId,
  loading,
  emptyText,
  onSelect,
}: PharmacyQueueTableProps) {
  if (loading) {
    return <TableSkeleton rows={4} columns={6} />;
  }

  if (queues.length === 0) {
    return <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Patient</th>
            <th className="px-4 py-3 font-medium">Doctor</th>
            <th className="px-4 py-3 font-medium">Requested</th>
            <th className="px-4 py-3 font-medium">Tags</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {queues.map((queue) => {
            const allergies = normalizeAllergies(queue.patient.allergies);

            return (
              <tr
                key={queue.id}
                className={clsx('border-t border-border align-top', selectedId === queue.id && 'bg-primary/5')}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{queue.patient.name}</p>
                  <p className="mt-1 text-xs text-muted">{queue.patient.phone ?? queue.patient.email ?? 'No contact'}</p>
                </td>
                <td className="px-4 py-3 text-foreground">{queue.prescription.staff.displayName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatPharmacyDateTime(queue.requestedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <PharmacyStatusBadge status={queue.status} />
                    {queue.prescription.isVoided ? <Badge variant="danger">Voided</Badge> : null}
                    {allergies.length > 0 ? <Badge variant="danger">Allergy</Badge> : null}
                  </div>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="text-foreground">{queue.dispensingItems.length}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{formatMedicationSummary(queue.dispensingItems)}</p>
                </td>
                <td className="px-4 py-3">
                  <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(queue)}>
                    Open
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(PharmacyQueueTable);
