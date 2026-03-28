import ThemeToggle from '@/ui/molecules/ThemeToggle';
import LanguageSwitch from '@/ui/molecules/LanguageSwitch';
import { useTranslation } from 'react-i18next';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '@/domain/transactions/transactions.hooks';

const TransactionsPageRQ = () => {
  const { t } = useTranslation(['transactions', 'common']); // namespaces
  const { data, isLoading, refetch } = useTransactions(1, 20);
  const createTx = useCreateTransaction();
  const delTx = useDeleteTransaction();

  return (
    <div className="p-4 space-y-4 min-h-screen bg-white dark:bg-black text-tx-light dark:text-tx-dark">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('transactions:title')}</h1>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => refetch()} className="px-3 py-1 border rounded">
          {t('common:load')}
        </button>
        <button
          onClick={() => createTx.mutate({ userId: 'u1', amount: 100, currency: 'EUR' })}
          className="px-3 py-1 border rounded"
        >
          {t('common:create')}
        </button>
      </div>

      {isLoading && <div>{t('common:loading')}</div>}

      <ul>
        {data?.items?.map((tItem: any) => (
          <li key={tItem.id} className="flex justify-between border-b py-1">
            <span>
              {t('transactions:currency', { amount: tItem.amount, currency: tItem.currency })}
            </span>
            <button onClick={() => delTx.mutate(tItem.id)} className="px-2 py-0.5 border rounded">
              {t('common:delete')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionsPageRQ;
