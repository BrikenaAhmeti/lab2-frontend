import { api } from '@/libs/axios/client';
import type { Transaction, CreateTransactionDTO, UpdateTransactionDTO, Page } from './transactions.types';

const BASE = '/transactions';

export const TransactionsApi = {
    list: (page = 1, pageSize = 20) =>
        api.core.get<Page<Transaction>>(`${BASE}?page=${page}&pageSize=${pageSize}`).then(r => r.data),

    get: (id: string) =>
        api.core.get<Transaction>(`${BASE}/${id}`).then(r => r.data),

    create: (payload: CreateTransactionDTO) =>
        api.core.post<Transaction>(BASE, payload).then(r => r.data),

    update: (id: string, payload: UpdateTransactionDTO) =>
        api.core.put<Transaction>(`${BASE}/${id}`, payload).then(r => r.data),

    remove: (id: string) =>
        api.core.delete<void>(`${BASE}/${id}`).then(r => r.data),
};
