import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi } from '@/lib/api/departments-api';
import {
  inventoryApi,
  type InventoryCategory,
  type InventoryCategoryListParams,
  type InventoryCategoryPayload,
  type InventoryItem,
  type InventoryItemListParams,
  type InventoryItemPayload,
  type InventoryTransactionPayload,
  type InventoryTransactionsParams,
} from '@/lib/api/inventory-api';
import type {
  InventoryCategoryFormValues,
  InventoryItemFormValues,
  InventoryTransactionFormValues,
} from '@/features/inventory/inventory.schemas';

export const inventoryQueryKey = {
  all: ['inventory'] as const,
  items: (params: InventoryItemListParams) => [...inventoryQueryKey.all, 'items', params] as const,
  categories: (params: InventoryCategoryListParams) => [...inventoryQueryKey.all, 'categories', params] as const,
  categoryOptions: ['inventory', 'category-options'] as const,
  departments: ['inventory', 'departments'] as const,
  transactions: (itemId: string, params: InventoryTransactionsParams) =>
    [...inventoryQueryKey.all, 'items', itemId, 'transactions', params] as const,
  alerts: (params: { expiringSoonDays?: number }) => [...inventoryQueryKey.all, 'alerts', params] as const,
};

export function useInventoryItems(params: InventoryItemListParams) {
  return useQuery({
    queryKey: inventoryQueryKey.items(params),
    queryFn: () => inventoryApi.items.list(params),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useInventoryCategories(params: InventoryCategoryListParams) {
  return useQuery({
    queryKey: inventoryQueryKey.categories(params),
    queryFn: () => inventoryApi.categories.list(params),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useInventoryCategoryOptions() {
  return useQuery({
    queryKey: inventoryQueryKey.categoryOptions,
    queryFn: async () => {
      const response = await inventoryApi.categories.list({ page: 1, limit: 100, isActive: true });
      return response.items;
    },
    retry: false,
  });
}

export function useInventoryDepartmentOptions() {
  return useQuery({
    queryKey: inventoryQueryKey.departments,
    queryFn: async () => {
      const response = await departmentsApi.list({ page: 1, limit: 100, isActive: true });
      return response.items;
    },
    retry: false,
  });
}

export function useInventoryTransactions(itemId: string | null, params: InventoryTransactionsParams) {
  return useQuery({
    queryKey: inventoryQueryKey.transactions(itemId ?? '', params),
    queryFn: () => inventoryApi.items.transactions(itemId ?? '', params),
    enabled: Boolean(itemId),
    retry: false,
  });
}

export function useInventoryAlerts(params: { expiringSoonDays?: number }) {
  return useQuery({
    queryKey: inventoryQueryKey.alerts(params),
    queryFn: () => inventoryApi.alerts(params),
    retry: false,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InventoryItemPayload) => inventoryApi.items.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryItemPayload }) => inventoryApi.items.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function useDeactivateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.items.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function useRecordInventoryTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryTransactionPayload }) =>
      inventoryApi.items.recordTransaction(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InventoryCategoryPayload) => inventoryApi.categories.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function useUpdateInventoryCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryCategoryPayload }) =>
      inventoryApi.categories.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function useDeactivateInventoryCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.categories.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryQueryKey.all });
    },
    retry: false,
  });
}

export function toInventoryItemPayload(values: InventoryItemFormValues): InventoryItemPayload {
  return {
    categoryId: values.categoryId,
    departmentId: values.departmentId || null,
    sku: values.sku.trim(),
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    unitOfMeasure: values.unitOfMeasure.trim(),
    currentStock: values.currentStock,
    reorderLevel: values.reorderLevel,
    unitCost: values.unitCost ?? null,
    expiryDate: values.expiryDate || null,
    isActive: values.isActive ?? true,
  };
}

export function toInventoryItemFormValues(item: InventoryItem): InventoryItemFormValues {
  return {
    categoryId: item.categoryId,
    departmentId: item.departmentId ?? '',
    sku: item.sku,
    name: item.name,
    description: item.description ?? '',
    unitOfMeasure: item.unitOfMeasure,
    currentStock: item.currentStock,
    reorderLevel: item.reorderLevel,
    unitCost: item.unitCost ?? undefined,
    expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
    isActive: item.isActive,
  };
}

export function toInventoryCategoryPayload(values: InventoryCategoryFormValues): InventoryCategoryPayload {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    parentId: values.parentId || null,
    isActive: values.isActive ?? true,
  };
}

export function toInventoryCategoryFormValues(category: InventoryCategory): InventoryCategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
    parentId: category.parentId ?? '',
    isActive: category.isActive,
  };
}

export function toInventoryTransactionPayload(values: InventoryTransactionFormValues): InventoryTransactionPayload {
  const payload: InventoryTransactionPayload = {
    type: values.type,
    quantity: values.quantity,
    reason: values.reason.trim(),
  };

  if (values.type === 'in') {
    if (values.unitCost !== undefined) payload.unitCost = values.unitCost;
    if (values.batchNumber?.trim()) payload.batchNumber = values.batchNumber.trim();
    if (values.expiryDate) payload.expiryDate = values.expiryDate;
  }

  if (values.type === 'transfer') {
    payload.targetDepartmentId = values.targetDepartmentId ?? null;
  }

  return payload;
}

export function inventoryStockStatus(item: Pick<InventoryItem, 'currentStock' | 'reorderLevel'>) {
  if (item.currentStock <= 0) {
    return { label: 'Out of stock', variant: 'danger' as const };
  }

  if (item.currentStock <= item.reorderLevel) {
    return { label: 'Low stock', variant: 'warning' as const };
  }

  return { label: 'In stock', variant: 'success' as const };
}

export function formatInventoryDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export function formatInventoryNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function transactionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    RECEIVED: 'Received',
    WRITTEN_OFF: 'Removed',
    ADJUSTED: 'Adjusted',
    TRANSFERRED: 'Transferred',
    DISPENSED: 'Dispensed',
  };

  return labels[type] ?? type;
}

export function getInventoryApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 403) return 'You do not have access to this inventory action';
    if (error.response?.status === 404) return 'Inventory record could not be found';
    if (error.response?.status === 409) return 'Inventory action could not be completed with the current stock';
    if (error.response?.status === 400) return 'Please review the inventory details and try again';
  }

  return fallback;
}
