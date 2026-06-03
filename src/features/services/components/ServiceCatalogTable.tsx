import { memo } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import { formatCurrency } from '@/utils/formatters/currency';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { ServiceRecord } from '@/lib/api/services-api';
import { getDepartmentName } from '@/features/services/hooks/useServiceCatalog';

interface ServiceCatalogTableProps {
  rows: ServiceRecord[];
  departments: DepartmentRecord[];
  canManage: boolean;
  mutationPending: boolean;
  onEdit: (service: ServiceRecord) => void;
  onDelete: (service: ServiceRecord) => void;
}

function ServiceCatalogTable({
  rows,
  departments,
  canManage,
  mutationPending,
  onEdit,
  onDelete,
}: ServiceCatalogTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Clinical service</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Duration</th>
            <th className="px-4 py-3 font-medium">Estimated fee</th>
            <th className="px-4 py-3 font-medium">Active</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((service) => (
            <tr key={service.id} className="border-t border-border align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{service.name}</p>
                {service.description ? <p className="mt-1 text-xs text-muted">{service.description}</p> : null}
              </td>
              <td className="px-4 py-3">{getDepartmentName(service, departments)}</td>
              <td className="px-4 py-3">{service.defaultDurationMinutes} min</td>
              <td className="px-4 py-3">{formatCurrency(Number(service.defaultPrice))}</td>
              <td className="px-4 py-3">
                <Badge variant={service.isActive ? 'success' : 'neutral'}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onEdit(service)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => onDelete(service)}>
                      Delete
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted">Read only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ServiceCatalogTable);
