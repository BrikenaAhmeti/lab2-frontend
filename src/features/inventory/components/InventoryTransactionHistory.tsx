import { AxiosError } from 'axios';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { InventoryItem, InventoryTransaction } from '@/lib/api/inventory-api';
import {
  formatInventoryDate,
  formatInventoryNumber,
  transactionTypeLabel,
  useInventoryTransactions,
} from '@/features/inventory/hooks/useInventory';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface InventoryTransactionHistoryProps {
  item: InventoryItem | null;
  onClose: () => void;
}

function variantFor(transaction: InventoryTransaction) {
  if (transaction.transactionType === 'RECEIVED') return 'success' as const;
  if (transaction.transactionType === 'WRITTEN_OFF' || transaction.transactionType === 'DISPENSED') return 'warning' as const;
  if (transaction.transactionType === 'ADJUSTED') return 'info' as const;
  return 'neutral' as const;
}

export default function InventoryTransactionHistory({ item, onClose }: InventoryTransactionHistoryProps) {
  const transactionsQuery = useInventoryTransactions(item?.id ?? null, { page: 1, limit: 10 });
  const rows = transactionsQuery.data?.items ?? [];
  const missingHistory =
    transactionsQuery.isError &&
    transactionsQuery.error instanceof AxiosError &&
    transactionsQuery.error.response?.status === 404;

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <section className="panel max-h-[90vh] w-full max-w-4xl overflow-y-auto p-5" role="dialog" aria-modal="true" aria-labelledby="inventory-history-title">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 id="inventory-history-title" className="text-lg font-semibold text-foreground">
              Transaction history
            </h4>
            <p className="text-sm text-muted">{item.name}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {transactionsQuery.isLoading ? <p className="text-sm text-muted">Loading transaction history...</p> : null}
        {transactionsQuery.isError && !missingHistory ? (
          <FeedbackMessage type="error" message="Transaction history could not be loaded" />
        ) : null}
        {missingHistory || (!transactionsQuery.isLoading && !transactionsQuery.isError && rows.length === 0) ? (
          <p className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
            No transaction history found for this item.
          </p>
        ) : null}
        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Expiry</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <Badge variant={variantFor(transaction)}>{transactionTypeLabel(transaction.transactionType)}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatInventoryNumber(transaction.quantity)}</td>
                    <td className="px-4 py-3">{transaction.notes ?? '-'}</td>
                    <td className="px-4 py-3">{transaction.batchNumber ?? '-'}</td>
                    <td className="px-4 py-3">{formatInventoryDate(transaction.expiryDate)}</td>
                    <td className="px-4 py-3">{formatInventoryDate(transaction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
