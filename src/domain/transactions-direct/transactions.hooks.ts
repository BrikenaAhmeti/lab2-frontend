import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionsService } from './transactions.service';
import type { Transaction, TransactionId, CreateTransactionDTO, UpdateTransactionDTO } from './transactions.types';

export function useTransactions(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['transactions', page, pageSize],
    queryFn: () => TransactionsService.list(page, pageSize),
    staleTime: 60_000
  });
}

export function useTransaction(id: TransactionId) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => TransactionsService.get(id),
    enabled: !!id
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionDTO) => TransactionsService.create(payload),
    onSuccess: (created: Transaction) => {
      qc.setQueryData<any>(['transactions', 1, 20], (old: any) =>
        old ? { ...old, items: [created, ...old.items], total: (old.total ?? 0) + 1 } : old
      );
    }
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: TransactionId; payload: UpdateTransactionDTO }) =>
      TransactionsService.update(id, payload),
    onSuccess: (updated: Transaction) => {
      // keep list fresh
      qc.setQueryData<any>(['transactions', 1, 20], (old: any) =>
        old ? { ...old, items: old.items.map((x: Transaction) => x.id === updated.id ? updated : x) } : old
      );
      // keep item detail fresh
      qc.setQueryData(['transactions', updated.id], updated);
    }
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: TransactionId) => TransactionsService.remove(id),
    onSuccess: (_resp, id) => {
      qc.setQueryData<any>(['transactions', 1, 20], (old: any) =>
        old ? { ...old, items: old.items.filter((x: Transaction) => x.id !== id), total: Math.max(0, (old.total ?? 0) - 1) } : old
      );
      qc.removeQueries({ queryKey: ['transactions', id] });
    }
  });
}
