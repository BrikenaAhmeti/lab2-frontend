import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTransactions, createTransaction, deleteTransaction } from '@/domain/transactions/transactions.slice';


const TransactionsPageRTK = () => {
  const dispatch = useAppDispatch();
  const page = useAppSelector(s => s.transactions.page);
  const loading = useAppSelector(s => s.transactions.loading);

  const load = async () => { await dispatch(fetchTransactions({ page: 1, pageSize: 10 })).unwrap(); };
  const add = async () => { await dispatch(createTransaction({ userId: 'u1', amount: 100, currency: 'EUR' })).unwrap(); };
  const remove = async (id: string) => { await dispatch(deleteTransaction(id)).unwrap(); };

  return (
    <div className="p-4 space-y-2">
      <button onClick={load}>Load</button>
      <button onClick={add}>Create</button>
      {loading && <div>Loading…</div>}
      <ul>
        {page?.items.map(t => (
          <li key={t.id}>
            {t.id} — {t.amount} {t.currency}
            <button onClick={() => remove(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default TransactionsPageRTK;