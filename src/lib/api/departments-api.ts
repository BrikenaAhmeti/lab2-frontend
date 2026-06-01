import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export interface DepartmentRecord {
  id: string;
  name: string;
  description: string | null;
  floor: string | null;
  phoneExtension: string | null;
  operatingHours: unknown | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentPayload {
  name: string;
  description?: string | null;
  floor?: string | null;
  phoneExtension?: string | null;
  operatingHours?: unknown | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface DepartmentListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface DepartmentListResponse {
  items: DepartmentRecord[];
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

function logDepartmentListRequest(instance: AxiosInstance, params: DepartmentListParams) {
  const url = instance.getUri({ url: '/api/departments', params });
  console.info('[admin-doctor-setup] departments request', { url });
  return url;
}

export const departmentsApi = {
  list(params: DepartmentListParams, instance?: AxiosInstance) {
    const api = client(instance);
    const url = logDepartmentListRequest(api, params);

    return api
      .get<DepartmentListResponse>('/api/departments', { params })
      .then((r) => {
        console.info('[admin-doctor-setup] departments response', {
          url,
          status: r.status,
          body: r.data,
        });
        return r.data;
      })
      .catch((error) => {
        console.error('[admin-doctor-setup] departments error', {
          url,
          status: error.response?.status,
          body: error.response?.data,
          message: error.message,
        });
        throw error;
      });
  },
  getById(id: string, instance?: AxiosInstance) {
    return client(instance).get<DepartmentRecord>(`/api/departments/${id}`).then((r) => r.data);
  },
  create(payload: DepartmentPayload, instance?: AxiosInstance) {
    return client(instance).post<DepartmentRecord>('/api/departments', payload).then((r) => r.data);
  },
  update(id: string, payload: Partial<DepartmentPayload>, instance?: AxiosInstance) {
    return client(instance).patch<DepartmentRecord>(`/api/departments/${id}`, payload).then((r) => r.data);
  },
  deactivate(id: string, instance?: AxiosInstance) {
    return client(instance).delete<DepartmentRecord>(`/api/departments/${id}`).then((r) => r.data);
  },
};
