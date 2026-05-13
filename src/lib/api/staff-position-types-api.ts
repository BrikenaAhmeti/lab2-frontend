import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export interface StaffPositionTypeDepartment {
  id: string;
  name: string;
  isActive: boolean;
}

export interface StaffPositionTypeRecord {
  id: string;
  name: string;
  description: string | null;
  defaultRoleKey: string;
  defaultRoleName: string;
  applicableDepartmentIds: string[] | null;
  applicableDepartments: StaffPositionTypeDepartment[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffPositionTypePayload {
  name: string;
  description?: string | null;
  defaultRoleKey: string;
  applicableDepartmentIds?: string[] | null;
  isActive?: boolean;
}

export interface StaffPositionTypeListParams {
  isActive?: boolean;
}

export interface StaffPositionTypeListResponse {
  items: StaffPositionTypeRecord[];
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const staffPositionTypesApi = {
  list(params: StaffPositionTypeListParams = {}, instance?: AxiosInstance) {
    return client(instance)
      .get<StaffPositionTypeListResponse>('/api/staff-position-types', { params })
      .then((response) => response.data);
  },
  getById(id: string, instance?: AxiosInstance) {
    return client(instance).get<StaffPositionTypeRecord>(`/api/staff-position-types/${id}`).then((response) => response.data);
  },
  create(payload: StaffPositionTypePayload, instance?: AxiosInstance) {
    return client(instance).post<StaffPositionTypeRecord>('/api/staff-position-types', payload).then((response) => response.data);
  },
  update(id: string, payload: Partial<StaffPositionTypePayload>, instance?: AxiosInstance) {
    return client(instance).put<StaffPositionTypeRecord>(`/api/staff-position-types/${id}`, payload).then((response) => response.data);
  },
  remove(id: string, instance?: AxiosInstance) {
    return client(instance).delete<void>(`/api/staff-position-types/${id}`).then((response) => response.data);
  },
};
