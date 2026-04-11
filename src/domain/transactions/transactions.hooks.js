import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionsService } from './transactions.service';
export function useTransactions(page = 1, pageSize = 20) {
    return useQuery({
        queryKey: ['transactions', page, pageSize],
        queryFn: () => TransactionsService.list(page, pageSize),
        staleTime: 60_000
    });
}
export function useTransaction(id) {
    return useQuery({
        queryKey: ['transactions', id],
        queryFn: () => TransactionsService.get(id),
        enabled: !!id
    });
}
export function useCreateTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: TransactionsService.create,
        onSuccess: (created) => {
            // optimistic list update — only for first page example
            qc.setQueryData(['transactions', 1, 20], (old) => old ? { ...old, items: [created, ...old.items], total: (old.total ?? 0) + 1 } : old);
        }
    });
}
export function useDeleteTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: TransactionsService.remove,
        onSuccess: (_void, id) => {
            qc.setQueryData(['transactions', 1, 20], (old) => old ? { ...old, items: old.items.filter((x) => x.id !== id), total: Math.max(0, (old.total ?? 0) - 1) } : old);
            qc.removeQueries({ queryKey: ['transactions', id] });
        }
    });
}
