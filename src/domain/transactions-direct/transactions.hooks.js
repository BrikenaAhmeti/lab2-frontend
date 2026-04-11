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
        mutationFn: (payload) => TransactionsService.create(payload),
        onSuccess: (created) => {
            qc.setQueryData(['transactions', 1, 20], (old) => old ? { ...old, items: [created, ...old.items], total: (old.total ?? 0) + 1 } : old);
        }
    });
}
export function useUpdateTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => TransactionsService.update(id, payload),
        onSuccess: (updated) => {
            // keep list fresh
            qc.setQueryData(['transactions', 1, 20], (old) => old ? { ...old, items: old.items.map((x) => x.id === updated.id ? updated : x) } : old);
            // keep item detail fresh
            qc.setQueryData(['transactions', updated.id], updated);
        }
    });
}
export function useDeleteTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id) => TransactionsService.remove(id),
        onSuccess: (_resp, id) => {
            qc.setQueryData(['transactions', 1, 20], (old) => old ? { ...old, items: old.items.filter((x) => x.id !== id), total: Math.max(0, (old.total ?? 0) - 1) } : old);
            qc.removeQueries({ queryKey: ['transactions', id] });
        }
    });
}
