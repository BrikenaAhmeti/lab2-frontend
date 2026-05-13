import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export interface ServiceRecord {
  id: string;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  name: string;
  description: string | null;
  defaultDurationMinutes: number;
  defaultPrice: string | number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePayload {
  departmentId: string;
  name: string;
  description?: string | null;
  defaultDurationMinutes: number;
  defaultPrice: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ServiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'defaultDurationMinutes' | 'defaultPrice' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface ServiceListResponse {
  items: ServiceRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const servicesApi = {
  list(params: ServiceListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<ServiceListResponse>('/api/services', { params })
      .then((r) => r.data);
  },
  getById(id: string, instance?: AxiosInstance) {
    return client(instance).get<ServiceRecord>(`/api/services/${id}`).then((r) => r.data);
  },
  create(payload: ServicePayload, instance?: AxiosInstance) {
    return client(instance).post<ServiceRecord>('/api/services', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<ServicePayload>, instance?: AxiosInstance) {
    return client(instance).put<ServiceRecord>(`/api/services/${id}`, payload).then((r) => r.data);
  },
  remove(id: string, instance?: AxiosInstance) {
    return client(instance).delete<ServiceRecord>(`/api/services/${id}`).then((r) => r.data);
  },
  deactivate(id: string, instance?: AxiosInstance) {
    return servicesApi.remove(id, instance);
  },
};
