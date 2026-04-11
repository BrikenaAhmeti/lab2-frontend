import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const remove = async (id) => {
        await dispatch(deleteTransaction(id)).unwrap();
    };
    return (_jsxs(Card, { title: "Transactions (RTK)", children: [_jsxs("div", { className: "mb-4 flex items-center gap-2", children: [_jsx(Button, { onClick: load, variant: "secondary", children: "Load" }), _jsx(Button, { onClick: add, children: "Create" })] }), loading && _jsx("div", { className: "text-sm text-muted", children: "Loading..." }), _jsx("ul", { className: "space-y-2", children: page?.items.map((t) => (_jsxs("li", { className: "flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm text-foreground", children: [t.amount, " ", t.currency] }), _jsx("p", { className: "text-xs text-muted", children: t.id })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "info", children: t.currency }), _jsx(Button, { onClick: () => remove(t.id), size: "sm", variant: "danger", children: "Delete" })] })] }, t.id))) })] }));
};
export default TransactionsPageRTK;
