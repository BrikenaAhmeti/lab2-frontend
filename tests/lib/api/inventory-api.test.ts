import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { inventoryApi } from '@/lib/api/inventory-api';

function mockClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } }),
    post: vi.fn().mockResolvedValue({ data: { id: 'item-1' } }),
    patch: vi.fn().mockResolvedValue({ data: { id: 'item-1' } }),
    delete: vi.fn().mockResolvedValue({ data: { id: 'item-1', isActive: false } }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe('inventoryApi', () => {
  it('uses the MS-27 item list route and query params', async () => {
    const instance = mockClient();

    await inventoryApi.items.list(
      {
        page: 2,
        limit: 10,
        search: 'asp',
        categoryId: 'category-1',
        departmentId: 'department-1',
        belowReorderLevel: true,
        expiryFrom: '2026-12-01',
        expiryTo: '2026-12-31',
        isActive: true,
        sortBy: 'name',
        sortDirection: 'asc',
      },
      instance
    );

    expect(instance.get).toHaveBeenCalledWith('/api/inventory/items', {
      params: {
        page: 2,
        limit: 10,
        search: 'asp',
        categoryId: 'category-1',
        departmentId: 'department-1',
        belowReorderLevel: true,
        expiryFrom: '2026-12-01',
        expiryTo: '2026-12-31',
        isActive: true,
        sortBy: 'name',
        sortDirection: 'asc',
      },
    });
  });

  it('posts item, category, transaction, and alert requests to backend inventory routes', async () => {
    const instance = mockClient();

    await inventoryApi.categories.create({ name: 'Medication', description: null, parentId: null, isActive: true }, instance);
    await inventoryApi.items.create(
      {
        categoryId: 'category-1',
        departmentId: null,
        sku: 'ASP-81',
        name: 'Aspirin 81 mg',
        description: 'Medication stock',
        unitOfMeasure: 'tablet',
        currentStock: 100,
        reorderLevel: 20,
        unitCost: 1.5,
        expiryDate: '2026-12-31',
        isActive: true,
      },
      instance
    );
    await inventoryApi.items.recordTransaction(
      'item-1',
      {
        type: 'transfer',
        quantity: 10,
        reason: 'Move stock to Cardiology',
        targetDepartmentId: 'department-2',
      },
      instance
    );
    await inventoryApi.alerts({ expiringSoonDays: 14 }, instance);

    expect(instance.post).toHaveBeenNthCalledWith(1, '/api/inventory/categories', {
      name: 'Medication',
      description: null,
      parentId: null,
      isActive: true,
    });
    expect(instance.post).toHaveBeenNthCalledWith(2, '/api/inventory/items', {
      categoryId: 'category-1',
      departmentId: null,
      sku: 'ASP-81',
      name: 'Aspirin 81 mg',
      description: 'Medication stock',
      unitOfMeasure: 'tablet',
      currentStock: 100,
      reorderLevel: 20,
      unitCost: 1.5,
      expiryDate: '2026-12-31',
      isActive: true,
    });
    expect(instance.post).toHaveBeenNthCalledWith(3, '/api/inventory/items/item-1/transactions', {
      type: 'transfer',
      quantity: 10,
      reason: 'Move stock to Cardiology',
      targetDepartmentId: 'department-2',
    });
    expect(instance.get).toHaveBeenLastCalledWith('/api/inventory/alerts', { params: { expiringSoonDays: 14 } });
  });
});
