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
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface StaffPositionTypeListResponse {
  items: StaffPositionTypeRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type StaffPositionTypeListEnvelope = {
  items?: unknown;
  data?: unknown;
  meta?: unknown;
  page?: unknown;
  limit?: unknown;
  total?: unknown;
  totalItems?: unknown;
  totalCount?: unknown;
  count?: unknown;
  totalPages?: unknown;
  pageCount?: unknown;
  pages?: unknown;
};

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
  }

  return undefined;
}

function arrayValue(value: unknown): StaffPositionTypeRecord[] {
  return Array.isArray(value) ? (value as StaffPositionTypeRecord[]) : [];
}

function normalizeStaffPositionTypeListResponse(
  value: StaffPositionTypeListResponse | StaffPositionTypeListEnvelope,
  params: StaffPositionTypeListParams
): StaffPositionTypeListResponse {
  const envelope = isRecord(value) ? value : {};
  const nestedData = isRecord(envelope.data) ? envelope.data : {};
  const meta = isRecord(envelope.meta) ? envelope.meta : isRecord(nestedData.meta) ? nestedData.meta : {};
  const items =
    arrayValue(envelope.items).length > 0
      ? arrayValue(envelope.items)
      : arrayValue(nestedData.items).length > 0
        ? arrayValue(nestedData.items)
        : arrayValue(envelope.data);
  const page = Math.max(1, numberValue(meta.page, envelope.page, nestedData.page, params.page) ?? 1);
  const limit = Math.max(1, numberValue(meta.limit, envelope.limit, nestedData.limit, params.limit, items.length) ?? 10);
  const explicitTotal = numberValue(
    meta.total,
    meta.totalItems,
    meta.totalCount,
    meta.count,
    envelope.total,
    envelope.totalItems,
    envelope.totalCount,
    envelope.count,
    nestedData.total,
    nestedData.totalItems,
    nestedData.totalCount,
    nestedData.count
  );
  const minimumTotal = (page - 1) * limit + items.length;
  const total = Math.max(explicitTotal ?? minimumTotal, minimumTotal);
  const explicitTotalPages = numberValue(
    meta.totalPages,
    meta.pageCount,
    meta.pages,
    envelope.totalPages,
    envelope.pageCount,
    envelope.pages,
    nestedData.totalPages,
    nestedData.pageCount,
    nestedData.pages
  );
  const calculatedTotalPages = Math.max(1, Math.ceil(total / limit));
  const totalPages = Math.max(explicitTotalPages ?? calculatedTotalPages, calculatedTotalPages);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export const staffPositionTypesApi = {
  list(params: StaffPositionTypeListParams = {}, instance?: AxiosInstance) {
    return client(instance)
      .get<StaffPositionTypeListResponse | StaffPositionTypeListEnvelope>('/api/staff-position-types', { params })
      .then((response) => normalizeStaffPositionTypeListResponse(response.data, params));
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
