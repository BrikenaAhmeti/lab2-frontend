import { api } from '@/libs/axios/client';
const BASE = '/transactions';
export const TransactionsApi = {
    list: (page = 1, pageSize = 20) => api.core.get(`${BASE}?page=${page}&pageSize=${pageSize}`).then(r => r.data),
    get: (id) => api.core.get(`${BASE}/${id}`).then(r => r.data),
    create: (payload) => api.core.post(BASE, payload).then(r => r.data),
    update: (id, payload) => api.core.put(`${BASE}/${id}`, payload).then(r => r.data),
    remove: (id) => api.core.delete(`${BASE}/${id}`).then(r => r.data),
};
