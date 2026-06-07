import { useMemo, useState } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { InventoryAlertItem, InventoryItem } from '@/lib/api/inventory-api';
import {
  formatInventoryDate,
  formatInventoryNumber,
  inventoryStockStatus,
  useInventoryAlerts,
} from '@/features/inventory/hooks/useInventory';

interface InventoryAlertsPanelProps {
  canManage: boolean;
  onTransaction: (item: InventoryItem) => void;
  onHistory: (item: InventoryItem) => void;
}

interface AlertListProps {
  title: string;
  rows: InventoryAlertItem[];
  canManage: boolean;
  onTransaction: (item: InventoryItem) => void;
  onHistory: (item: InventoryItem) => void;
}

function AlertList({ title, rows, canManage, onTransaction, onHistory }: AlertListProps) {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <Badge variant={rows.length > 0 ? 'warning' : 'success'}>{rows.length}</Badge>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted">No items to show.</p> : null}
      <div className="space-y-3">
        {rows.map((alert) => {
          const status = inventoryStockStatus(alert.item);

          return (
            <div key={`${alert.type}-${alert.item.id}`} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{alert.item.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {alert.item.sku} | {alert.item.category?.name ?? '-'} | {alert.item.department?.name ?? '-'}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatInventoryNumber(alert.currentStock)} {alert.item.unitOfMeasure}
                    {alert.expiryDate ? ` | expires ${formatInventoryDate(alert.expiryDate)}` : ''}
                    {alert.daysUntilExpiry !== null ? ` | ${alert.daysUntilExpiry} days` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Button type="button" size="sm" variant="secondary" onClick={() => onHistory(alert.item)}>
                    History
                  </Button>
                  {canManage ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => onTransaction(alert.item)}>
                      Stock
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function InventoryAlertsPanel({ canManage, onTransaction, onHistory }: InventoryAlertsPanelProps) {
  const [days, setDays] = useState('30');
  const params = useMemo(() => ({ expiringSoonDays: Number(days) || 30 }), [days]);
  const alertsQuery = useInventoryAlerts(params);
  const alerts = alertsQuery.data;

  return (
    <section className="space-y-4">
      <div className="max-w-48">
        <Input
          id="inventory-alert-days"
          label="Expiry window"
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(event) => setDays(event.target.value)}
          helperText="Days"
        />
      </div>

      {alertsQuery.isLoading ? <p className="text-sm text-muted">Loading inventory alerts...</p> : null}
      {alertsQuery.isError ? <FeedbackMessage type="error" message="Inventory alerts could not be loaded" /> : null}

      {alerts ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <AlertList
            title="Critical Shortage"
            rows={alerts.criticalShortage}
            canManage={canManage}
            onTransaction={onTransaction}
            onHistory={onHistory}
          />
          <AlertList
            title="Low Stock"
            rows={alerts.lowStock}
            canManage={canManage}
            onTransaction={onTransaction}
            onHistory={onHistory}
          />
          <AlertList
            title="Expiring Soon"
            rows={alerts.expiringSoon}
            canManage={canManage}
            onTransaction={onTransaction}
            onHistory={onHistory}
          />
        </div>
      ) : null}
    </section>
  );
}
