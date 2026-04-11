import ThemeToggle from '@/ui/molecules/ThemeToggle';
import LanguageSwitch from '@/ui/molecules/LanguageSwitch';
import { useTranslation } from 'react-i18next';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '@/domain/transactions/transactions.hooks';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';

const TransactionsPageRQ = () => {
  const { t } = useTranslation(['transactions', 'common']); // namespaces
  const { data, isLoading, refetch } = useTransactions(1, 20);
  const createTx = useCreateTransaction();
  const delTx = useDeleteTransaction();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{t('transactions:title')}</h1>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => refetch()} variant="secondary">
          {t('common:load')}
        </Button>
        <Button
          onClick={() => createTx.mutate({ userId: 'u1', amount: 100, currency: 'EUR' })}
        >
          {t('common:create')}
        </Button>
      </div>

      <Card>
        {isLoading && <div className="text-sm text-muted">{t('common:loading')}</div>}
        <ul className="space-y-2">
          {data?.items?.map((tItem: any) => (
            <li key={tItem.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
              <div>
                <span className="text-sm text-foreground">
                  {t('transactions:currency', { amount: tItem.amount, currency: tItem.currency })}
                </span>
                <p className="text-xs text-muted">{tItem.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info">{tItem.currency}</Badge>
                <Button onClick={() => delTx.mutate(tItem.id)} size="sm" variant="danger">
                  {t('common:delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default TransactionsPageRQ;
