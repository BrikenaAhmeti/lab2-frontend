import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InventoryPage from '@/features/inventory/pages/InventoryPage';
import authReducer from '@/features/auth/authSlice';
import { departmentsApi } from '@/lib/api/departments-api';
import { inventoryApi, type InventoryAlertsResponse, type InventoryItem } from '@/lib/api/inventory-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/departments-api', () => ({
  departmentsApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/lib/api/inventory-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/inventory-api')>('@/lib/api/inventory-api');

  return {
    ...actual,
    inventoryApi: {
      categories: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
      },
      items: {
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        transactions: vi.fn(),
        recordTransaction: vi.fn(),
      },
      alerts: vi.fn(),
    },
  };
});

const categoryId = '11111111-1111-4111-8111-111111111111';
const departmentId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';

const categoriesResponse = {
  items: [
    {
      id: categoryId,
      name: 'Medication',
      description: 'Medication stock',
      parentId: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      parent: null,
    },
  ],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};

const departmentsResponse = {
  items: [
    {
      id: departmentId,
      name: 'Pharmacy',
      description: null,
      floor: null,
      phoneExtension: null,
      operatingHours: null,
      isActive: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};

const item: InventoryItem = {
  id: itemId,
  categoryId,
  departmentId,
  sku: 'ASP-81',
  name: 'Aspirin 81 mg',
  description: 'Medication stock',
  unitOfMeasure: 'tablet',
  currentStock: 5,
  reorderLevel: 10,
  unitCost: 1.5,
  expiryDate: '2026-12-31T00:00:00.000Z',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  category: { id: categoryId, name: 'Medication', isActive: true },
  department: { id: departmentId, name: 'Pharmacy', isActive: true },
};

const itemsResponse = {
  items: [item],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

const alertsResponse: InventoryAlertsResponse = {
  generatedAt: '2026-05-30T10:00:00.000Z',
  expiringSoonDays: 30,
  lowStock: [
    {
      type: 'low_stock',
      item,
      currentStock: 5,
      reorderLevel: 10,
      expiryDate: item.expiryDate,
      daysUntilExpiry: 20,
    },
  ],
  criticalShortage: [],
  expiringSoon: [],
};

function renderInventoryPage(permissions: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: 'token',
        tokens: { accessToken: 'token' },
        status: 'authenticated' as const,
        user: {
          id: 'admin-user',
          email: 'admin@medsphere.local',
          roles: ['Admin'],
          permissions,
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/inventory']}>
          <InventoryPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function inputById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing input: ${id}`);
  }
  return element;
}

function selectById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Missing select: ${id}`);
  }
  return element;
}

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryApi.categories.list).mockResolvedValue(categoriesResponse);
    vi.mocked(inventoryApi.items.list).mockResolvedValue(itemsResponse);
    vi.mocked(inventoryApi.items.transactions).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    vi.mocked(inventoryApi.alerts).mockResolvedValue(alertsResponse);
    vi.mocked(departmentsApi.list).mockResolvedValue(departmentsResponse);
  });

  it('blocks users without inventory read access', () => {
    renderInventoryPage([]);

    expect(screen.getByText('auth.forbiddenTitle')).toBeInTheDocument();
  });

  it('shows inventory items with stock status and backend query params', async () => {
    renderInventoryPage(['inventory:read']);

    expect(await screen.findByText('Aspirin 81 mg')).toBeInTheDocument();
    expect(screen.getByText('ASP-81')).toBeInTheDocument();
    expect(screen.getAllByText('Medication').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pharmacy').length).toBeGreaterThan(0);
    expect(screen.getByText('Low stock')).toBeInTheDocument();

    expect(inventoryApi.items.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      categoryId: undefined,
      departmentId: undefined,
      belowReorderLevel: undefined,
      expiringSoonDays: undefined,
      isActive: true,
      sortBy: 'name',
      sortDirection: 'asc',
    });
  });

  it('creates an item using the MS-27 item payload', async () => {
    renderInventoryPage(['inventory:read', 'inventory:manage:all']);
    vi.mocked(inventoryApi.items.create).mockResolvedValue({ ...item, id: '44444444-4444-4444-8444-444444444444' });

    expect(await screen.findByText('Aspirin 81 mg')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    fireEvent.change(selectById('inventory-item-category'), { target: { value: categoryId } });
    fireEvent.change(selectById('inventory-item-department'), { target: { value: departmentId } });
    fireEvent.change(inputById('inventory-item-name'), { target: { value: 'Aspirin 81 mg' } });
    fireEvent.change(inputById('inventory-item-sku'), { target: { value: 'ASP-81' } });
    fireEvent.change(inputById('inventory-item-unit'), { target: { value: 'tablet' } });
    fireEvent.change(inputById('inventory-item-stock'), { target: { value: '100' } });
    fireEvent.change(inputById('inventory-item-reorder'), { target: { value: '20' } });
    fireEvent.change(inputById('inventory-item-unit-cost'), { target: { value: '1.5' } });
    fireEvent.change(inputById('inventory-item-expiry'), { target: { value: '2026-12-31' } });
    fireEvent.change(inputById('inventory-item-description'), { target: { value: 'Medication stock' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create item' }));

    await waitFor(() => {
      expect(inventoryApi.items.create).toHaveBeenCalledWith({
        categoryId,
        departmentId,
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
    });
  });

  it('records a receive stock transaction with only needed fields', async () => {
    renderInventoryPage(['inventory:read', 'inventory:manage:all']);
    vi.mocked(inventoryApi.items.recordTransaction).mockResolvedValue({
      item: { ...item, currentStock: 55 },
      transactions: [],
    });

    expect(await screen.findByText('Aspirin 81 mg')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stock' }));
    fireEvent.change(inputById('inventory-transaction-quantity'), { target: { value: '50' } });
    fireEvent.change(inputById('inventory-transaction-reason'), { target: { value: 'Supplier delivery' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record transaction' }));

    await waitFor(() => {
      expect(inventoryApi.items.recordTransaction).toHaveBeenCalledWith(itemId, {
        type: 'in',
        quantity: 50,
        reason: 'Supplier delivery',
      });
    });
  });

  it('supports category creation and alerts from the inventory backend', async () => {
    renderInventoryPage(['inventory:read', 'inventory:manage:all']);
    vi.mocked(inventoryApi.categories.create).mockResolvedValue({
      ...categoriesResponse.items[0],
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Supplies',
    });

    expect(await screen.findByText('Aspirin 81 mg')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Category' }));
    fireEvent.change(inputById('inventory-category-name'), { target: { value: 'Supplies' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create category' }));

    await waitFor(() => {
      expect(inventoryApi.categories.create).toHaveBeenCalledWith({
        name: 'Supplies',
        description: null,
        parentId: null,
        isActive: true,
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Alerts' }));

    expect(await screen.findByText('Critical Shortage')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
    expect(inventoryApi.alerts).toHaveBeenCalledWith({ expiringSoonDays: 30 });
  });
});
