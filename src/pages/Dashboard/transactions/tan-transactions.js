import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-semibold text-foreground", children: t('transactions:title') }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(LanguageSwitch, {}), _jsx(ThemeToggle, {})] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: () => refetch(), variant: "secondary", children: t('common:load') }), _jsx(Button, { onClick: () => createTx.mutate({ userId: 'u1', amount: 100, currency: 'EUR' }), children: t('common:create') })] }), _jsxs(Card, { children: [isLoading && _jsx("div", { className: "text-sm text-muted", children: t('common:loading') }), _jsx("ul", { className: "space-y-2", children: data?.items?.map((tItem) => (_jsxs("li", { className: "flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2", children: [_jsxs("div", { children: [_jsx("span", { className: "text-sm text-foreground", children: t('transactions:currency', { amount: tItem.amount, currency: tItem.currency }) }), _jsx("p", { className: "text-xs text-muted", children: tItem.id })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "info", children: tItem.currency }), _jsx(Button, { onClick: () => delTx.mutate(tItem.id), size: "sm", variant: "danger", children: t('common:delete') })] })] }, tItem.id))) })] })] }));
};
export default TransactionsPageRQ;
