import { memo } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { InventoryItem } from '@/lib/api/inventory-api';
import { formatInventoryDate, formatInventoryNumber, inventoryStockStatus } from '@/features/inventory/hooks/useInventory';

interface InventoryItemsTableProps {
  rows: InventoryItem[];
  canManage: boolean;
  mutationPending: boolean;
  onEdit: (item: InventoryItem) => void;
  onDeactivate: (item: InventoryItem) => void;
  onTransaction: (item: InventoryItem) => void;
  onHistory: (item: InventoryItem) => void;
}

function InventoryItemsTable({
  rows,
  canManage,
  mutationPending,
  onEdit,
  onDeactivate,
  onTransaction,
  onHistory,
}: InventoryItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Quantity</th>
            <th className="px-4 py-3 font-medium">Unit</th>
            <th className="min-w-28 px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Expiry</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const stockStatus = inventoryStockStatus(item);

            return (
              <tr key={item.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{item.name}</p>
                  {item.description ? <p className="mt-1 text-xs text-muted">{item.description}</p> : null}
                  {!item.isActive ? (
                    <Badge variant="neutral" className="mt-2">
                      Inactive
                    </Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{item.sku}</td>
                <td className="px-4 py-3">{item.category?.name ?? '-'}</td>
                <td className="px-4 py-3">{item.department?.name ?? '-'}</td>
                <td className="px-4 py-3">{formatInventoryNumber(item.currentStock)}</td>
                <td className="px-4 py-3">{item.unitOfMeasure}</td>
                <td className="min-w-28 px-4 py-3">
                  <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                </td>
                <td className="px-4 py-3">{formatInventoryDate(item.expiryDate)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onHistory(item)}>
                      History
                    </Button>
                    {canManage ? (
                      <>
                        <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onTransaction(item)}>
                          Stock
                        </Button>
                        <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onEdit(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => onDeactivate(item)}>
                          Deactivate
                        </Button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(InventoryItemsTable);
