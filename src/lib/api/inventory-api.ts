import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export type InventorySortBy = 'name' | 'sku' | 'currentStock' | 'reorderLevel' | 'expiryDate' | 'createdAt' | 'updatedAt';
export type InventorySortDirection = 'asc' | 'desc';
export type InventoryTransactionKind = 'in' | 'out' | 'adjustment' | 'transfer';
export type InventoryTransactionType = 'RECEIVED' | 'WRITTEN_OFF' | 'ADJUSTED' | 'TRANSFERRED' | 'DISPENSED';

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent: { id: string; name: string } | null;
}

export interface InventorySummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  categoryId: string;
  departmentId: string | null;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number | null;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: InventorySummary;
  department: InventorySummary | null;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  unitCost: number | null;
  batchNumber: string | null;
  expiryDate: string | null;
  referenceEntityType: string | null;
  referenceEntityId: string | null;
  notes: string | null;
  performedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAlertItem {
  type: 'low_stock' | 'critical_shortage' | 'expiring_soon';
  item: InventoryItem;
  currentStock: number;
  reorderLevel: number;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
}

export interface InventoryAlertsResponse {
  generatedAt: string;
  expiringSoonDays: number;
  lowStock: InventoryAlertItem[];
  criticalShortage: InventoryAlertItem[];
  expiringSoon: InventoryAlertItem[];
}

export interface InventoryListResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryCategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface InventoryCategoryPayload {
  name: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
}

export interface InventoryItemListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  departmentId?: string;
  belowReorderLevel?: boolean;
  expiryFrom?: string;
  expiryTo?: string;
  isActive?: boolean;
  sortBy?: InventorySortBy;
  sortDirection?: InventorySortDirection;
}

export interface InventoryItemPayload {
  categoryId: string;
  departmentId?: string | null;
  sku: string;
  name: string;
  description?: string | null;
  unitOfMeasure: string;
  currentStock?: number;
  reorderLevel?: number;
  unitCost?: number | null;
  expiryDate?: string | null;
  isActive?: boolean;
}

export interface InventoryTransactionsParams {
  page?: number;
  limit?: number;
}

export interface InventoryTransactionPayload {
  type: InventoryTransactionKind;
  quantity: number;
  reason: string;
  unitCost?: number | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  reference?: {
    type: string;
    id: string;
  };
  targetDepartmentId?: string | null;
}

export interface InventoryTransactionResponse {
  item: InventoryItem;
  transactions: InventoryTransaction[];
}

export interface InventoryAlertsParams {
  expiringSoonDays?: number;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const inventoryApi = {
  categories: {
    list(params: InventoryCategoryListParams, instance?: AxiosInstance) {
      return client(instance)
        .get<InventoryListResponse<InventoryCategory>>('/api/inventory/categories', { params })
        .then((r) => r.data);
    },
    get(id: string, instance?: AxiosInstance) {
      return client(instance).get<InventoryCategory>(`/api/inventory/categories/${id}`).then((r) => r.data);
    },
    create(payload: InventoryCategoryPayload, instance?: AxiosInstance) {
      return client(instance).post<InventoryCategory>('/api/inventory/categories', payload).then((r) => r.data);
    },
    update(id: string, payload: Partial<InventoryCategoryPayload>, instance?: AxiosInstance) {
      return client(instance).patch<InventoryCategory>(`/api/inventory/categories/${id}`, payload).then((r) => r.data);
    },
    remove(id: string, instance?: AxiosInstance) {
      return client(instance).delete<InventoryCategory>(`/api/inventory/categories/${id}`).then((r) => r.data);
    },
  },
  items: {
    list(params: InventoryItemListParams, instance?: AxiosInstance) {
      return client(instance)
        .get<InventoryListResponse<InventoryItem>>('/api/inventory/items', { params })
        .then((r) => r.data);
    },
    get(id: string, instance?: AxiosInstance) {
      return client(instance).get<InventoryItem>(`/api/inventory/items/${id}`).then((r) => r.data);
    },
    create(payload: InventoryItemPayload, instance?: AxiosInstance) {
      return client(instance).post<InventoryItem>('/api/inventory/items', payload).then((r) => r.data);
    },
    update(id: string, payload: Partial<InventoryItemPayload>, instance?: AxiosInstance) {
      return client(instance).patch<InventoryItem>(`/api/inventory/items/${id}`, payload).then((r) => r.data);
    },
    remove(id: string, instance?: AxiosInstance) {
      return client(instance).delete<InventoryItem>(`/api/inventory/items/${id}`).then((r) => r.data);
    },
    transactions(id: string, params: InventoryTransactionsParams, instance?: AxiosInstance) {
      return client(instance)
        .get<InventoryListResponse<InventoryTransaction>>(`/api/inventory/items/${id}/transactions`, { params })
        .then((r) => r.data);
    },
    recordTransaction(id: string, payload: InventoryTransactionPayload, instance?: AxiosInstance) {
      return client(instance)
        .post<InventoryTransactionResponse>(`/api/inventory/items/${id}/transactions`, payload)
        .then((r) => r.data);
    },
  },
  alerts(params: InventoryAlertsParams, instance?: AxiosInstance) {
    return client(instance).get<InventoryAlertsResponse>('/api/inventory/alerts', { params }).then((r) => r.data);
  },
};
