import { api } from '@/libs/axios/client';
import type {
  Transaction, TransactionId, CreateTransactionDTO, UpdateTransactionDTO, DeleteTransactionResponse, Page
} from './transactions.types';

const BASE = '/transactions'; // endpoints scoped to this feature

export const TransactionsService = {
  // GET /transactions?page=1&pageSize=20
  list: async (page = 1, pageSize = 20): Promise<Page<Transaction>> => {
    const { data } = await api.core.get<Page<Transaction>>(`${BASE}?page=${page}&pageSize=${pageSize}`);
    return data;
  },

  // GET /transactions/:id
  get: async (id: TransactionId): Promise<Transaction> => {
    const { data } = await api.core.get<Transaction>(`${BASE}/${id}`);
    return data;
  },

  // POST /transactions
  create: async (payload: CreateTransactionDTO): Promise<Transaction> => {
    const { data } = await api.core.post<Transaction>(BASE, payload);
    return data;
  },

  // PUT /transactions/:id
  update: async (id: TransactionId, payload: UpdateTransactionDTO): Promise<Transaction> => {
    const { data } = await api.core.put<Transaction>(`${BASE}/${id}`, payload);
    return data;
  },

  // DELETE /transactions/:id
  // If your API returns no body, change `<DeleteTransactionResponse>` to `<void>` and the Promise to `Promise<void>`
  remove: async (id: TransactionId): Promise<DeleteTransactionResponse> => {
    const { data } = await api.core.delete<DeleteTransactionResponse>(`${BASE}/${id}`);
    return data;
  },
};
