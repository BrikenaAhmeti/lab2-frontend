import { api } from '@/libs/axios/client';
const BASE = '/transactions'; // endpoints scoped to this feature
export const TransactionsService = {
    // GET /transactions?page=1&pageSize=20
    list: async (page = 1, pageSize = 20) => {
        const { data } = await api.core.get(`${BASE}?page=${page}&pageSize=${pageSize}`);
        return data;
    },
    // GET /transactions/:id
    get: async (id) => {
        const { data } = await api.core.get(`${BASE}/${id}`);
        return data;
    },
    // POST /transactions
    create: async (payload) => {
        const { data } = await api.core.post(BASE, payload);
        return data;
    },
    // PUT /transactions/:id
    update: async (id, payload) => {
        const { data } = await api.core.put(`${BASE}/${id}`, payload);
        return data;
    },
    // DELETE /transactions/:id
    // If your API returns no body, change `<DeleteTransactionResponse>` to `<void>` and the Promise to `Promise<void>`
    remove: async (id) => {
        const { data } = await api.core.delete(`${BASE}/${id}`);
        return data;
    },
};
