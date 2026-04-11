import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTransactions, createTransaction, deleteTransaction } from '@/domain/transactions/transactions.slice';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';

const TransactionsPageRTK = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.transactions.page);
  const loading = useAppSelector((s) => s.transactions.loading);

  const load = async () => {
    await dispatch(fetchTransactions({ page: 1, pageSize: 10 })).unwrap();
  };
  const add = async () => {
    await dispatch(createTransaction({ userId: 'u1', amount: 100, currency: 'EUR' })).unwrap();
  };
  const remove = async (id: string) => {
    await dispatch(deleteTransaction(id)).unwrap();
  };

  return (
    <Card title="Transactions (RTK)">
      <div className="mb-4 flex items-center gap-2">
        <Button onClick={load} variant="secondary">Load</Button>
        <Button onClick={add}>Create</Button>
      </div>
      {loading && <div className="text-sm text-muted">Loading...</div>}
      <ul className="space-y-2">
        {page?.items.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
            <div>
              <p className="text-sm text-foreground">{t.amount} {t.currency}</p>
              <p className="text-xs text-muted">{t.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{t.currency}</Badge>
              <Button onClick={() => remove(t.id)} size="sm" variant="danger">Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
export default TransactionsPageRTK;
