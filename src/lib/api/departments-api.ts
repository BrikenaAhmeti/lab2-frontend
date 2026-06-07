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

export type DepartmentSortBy = 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
export type DepartmentSortDirection = 'asc' | 'desc';

export interface DepartmentListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: DepartmentSortBy;
  sortDirection?: DepartmentSortDirection;
  openAt?: string;
  openFrom?: string;
  openTo?: string;
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

type DepartmentListEnvelope = {
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

function arrayValue(value: unknown): DepartmentRecord[] {
  return Array.isArray(value) ? (value as DepartmentRecord[]) : [];
}

function normalizeDepartmentListResponse(
  value: DepartmentListResponse | DepartmentListEnvelope,
  params: DepartmentListParams
): DepartmentListResponse {
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
  const inferredTotal =
    explicitTotal === undefined && items.length >= limit ? page * limit + 1 : minimumTotal;
  const total = Math.max(explicitTotal ?? inferredTotal, minimumTotal);
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

export const departmentsApi = {
  list(params: DepartmentListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<DepartmentListResponse | DepartmentListEnvelope>('/api/departments', { params })
      .then((r) => normalizeDepartmentListResponse(r.data, params));
  },
  publicList(params: DepartmentListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<DepartmentListResponse | DepartmentListEnvelope>('/api/public/departments', { params })
      .then((r) => normalizeDepartmentListResponse(r.data, params));
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
