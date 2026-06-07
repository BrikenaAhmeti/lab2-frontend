import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import ExportButton from '@/components/export/ExportButton';
import { hasAnyPermission } from '@/features/auth/utils/permission';
import InventoryAlertsPanel from '@/features/inventory/components/InventoryAlertsPanel';
import InventoryCategoriesPanel from '@/features/inventory/components/InventoryCategoriesPanel';
import InventoryFilters from '@/features/inventory/components/InventoryFilters';
import InventoryItemFormModal from '@/features/inventory/components/InventoryItemFormModal';
import InventoryItemsTable from '@/features/inventory/components/InventoryItemsTable';
import InventoryTransactionHistory from '@/features/inventory/components/InventoryTransactionHistory';
import InventoryTransactionModal from '@/features/inventory/components/InventoryTransactionModal';
import type { ActiveStatus, InventoryItemFormValues, InventoryTransactionFormValues } from '@/features/inventory/inventory.schemas';
import {
  getInventoryApiErrorMessage,
  toInventoryItemPayload,
  toInventoryTransactionPayload,
  useCreateInventoryItem,
  useDeactivateInventoryItem,
  useInventoryCategoryOptions,
  useInventoryDepartmentOptions,
  useInventoryItems,
  useRecordInventoryTransaction,
  useUpdateInventoryItem,
} from '@/features/inventory/hooks/useInventory';
import type { InventoryItem } from '@/lib/api/inventory-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import { TableSkeleton } from '@/ui/atoms/Skeleton';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import {
  dateModeFilterToRange,
  emptyDateModeFilterValue,
  type DateModeFilterValue,
} from '@/ui/molecules/DateModeFilter';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import Pagination from '@/ui/molecules/Pagination';

type InventoryTab = 'items' | 'categories' | 'alerts';
type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const defaultPageSize = 10;
const tabs: Array<{ id: InventoryTab; label: string }> = [
  { id: 'items', label: 'Items' },
  { id: 'categories', label: 'Categories' },
  { id: 'alerts', label: 'Alerts' },
];

export default function InventoryPage() {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const canRead = hasAnyPermission(permissions, ['inventory:read', 'inventory:manage:all'], 'any');
  const canManage = hasAnyPermission(permissions, ['inventory:manage:all'], 'any');

  const [activeTab, setActiveTab] = useState<InventoryTab>('items');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [belowReorderLevel, setBelowReorderLevel] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState<DateModeFilterValue>(emptyDateModeFilterValue);
  const [activeFilter, setActiveFilter] = useState<ActiveStatus>('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formError, setFormError] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [transactionItem, setTransactionItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const expiryRange = useMemo(() => dateModeFilterToRange(expiryFilter), [expiryFilter]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      departmentId: departmentId || undefined,
      belowReorderLevel: belowReorderLevel || undefined,
      expiryFrom: expiryRange.from,
      expiryTo: expiryRange.to,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      sortBy: 'name' as const,
      sortDirection: 'asc' as const,
    }),
    [activeFilter, belowReorderLevel, categoryId, departmentId, expiryRange.from, expiryRange.to, limit, page, search]
  );
  const exportFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      categoryId: categoryId || undefined,
      departmentId: departmentId || undefined,
      belowReorderLevel: belowReorderLevel || undefined,
      expiryFrom: expiryRange.from,
      expiryTo: expiryRange.to,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
    }),
    [activeFilter, belowReorderLevel, categoryId, departmentId, expiryRange.from, expiryRange.to, search]
  );

  const itemsQuery = useInventoryItems(listParams);
  const categoriesQuery = useInventoryCategoryOptions();
  const departmentsQuery = useInventoryDepartmentOptions();
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();
  const deactivateMutation = useDeactivateInventoryItem();
  const transactionMutation = useRecordInventoryTransaction();

  const items = itemsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const paginationMeta = itemsQuery.data?.meta;
  const mutationPending =
    createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending || transactionMutation.isPending;

  useEffect(() => {
    setPage(1);
  }, [search, categoryId, departmentId, belowReorderLevel, expiryRange.from, expiryRange.to, activeFilter]);

  useEffect(() => {
    if (paginationMeta && paginationMeta.totalPages > 0 && page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta]);

  if (!canRead) {
    return <Forbidden />;
  }

  const openCreateModal = () => {
    setFeedback(null);
    setFormError('');
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setFeedback(null);
    setFormError('');
    setEditingItem(item);
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setFormError('');
    setEditingItem(null);
    setShowItemModal(false);
  };

  const openTransactionModal = (item: InventoryItem) => {
    setFeedback(null);
    setTransactionError('');
    setTransactionItem(item);
  };

  const closeTransactionModal = () => {
    setTransactionError('');
    setTransactionItem(null);
  };

  const updateLimit = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const submitItem = async (values: InventoryItemFormValues) => {
    setFeedback(null);
    setFormError('');
    const payload = toInventoryItemPayload(values);

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, payload });
        setFeedback({ type: 'success', message: 'Inventory item updated successfully' });
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback({ type: 'success', message: 'Inventory item created successfully' });
      }
      closeItemModal();
    } catch (error) {
      setFormError(getInventoryApiErrorMessage(error, 'Inventory item could not be saved'));
    }
  };

  const submitTransaction = async (values: InventoryTransactionFormValues) => {
    if (!transactionItem) return;

    setFeedback(null);
    setTransactionError('');

    try {
      const result = await transactionMutation.mutateAsync({
        id: transactionItem.id,
        payload: toInventoryTransactionPayload(values),
      });
      setHistoryItem(result.item);
      setFeedback({ type: 'success', message: 'Stock transaction recorded successfully' });
      closeTransactionModal();
    } catch (error) {
      setTransactionError(getInventoryApiErrorMessage(error, 'Stock transaction could not be recorded'));
    }
  };

  const deactivateItem = async (item: InventoryItem) => {
    if (!window.confirm(`Deactivate ${item.name}?`)) return;

    setFeedback(null);
    try {
      await deactivateMutation.mutateAsync(item.id);
      setFeedback({ type: 'success', message: 'Inventory item deactivated successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: getInventoryApiErrorMessage(error, 'Inventory item could not be deactivated') });
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Inventory' }]} />

      <Card
        title="Inventory"
        subtitle="Manage stock, categories, transactions, and alerts"
        actions={
          activeTab === 'items' ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ExportButton entity="inventory-items" filters={exportFilters} />
              {canManage ? (
                <Button type="button" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
                  Add Item
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  'rounded-xl border px-3 py-2 text-sm font-medium transition',
                  activeTab === tab.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-surface'
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'items' ? (
            <div className="space-y-4">
              <InventoryFilters
                search={search}
                categoryId={categoryId}
                departmentId={departmentId}
                belowReorderLevel={belowReorderLevel}
                expiryFilter={expiryFilter}
                isActive={activeFilter}
                categories={categories}
                departments={departments}
                onSearchChange={setSearch}
                onCategoryChange={setCategoryId}
                onDepartmentChange={setDepartmentId}
                onBelowReorderLevelChange={setBelowReorderLevel}
                onExpiryFilterChange={setExpiryFilter}
                onStatusChange={setActiveFilter}
              />

              {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}
              {itemsQuery.isLoading ? <TableSkeleton rows={4} columns={9} /> : null}
              {itemsQuery.isError ? <FeedbackMessage type="error" message="Inventory items could not be loaded" /> : null}
              {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
                  No inventory items found.
                </p>
              ) : null}

              {!itemsQuery.isLoading && !itemsQuery.isError && items.length > 0 ? (
                <InventoryItemsTable
                  rows={items}
                  canManage={canManage}
                  mutationPending={mutationPending}
                  onEdit={openEditModal}
                  onDeactivate={deactivateItem}
                  onTransaction={openTransactionModal}
                  onHistory={setHistoryItem}
                />
              ) : null}

              {!itemsQuery.isLoading && !itemsQuery.isError && paginationMeta ? (
                <Pagination
                  page={page}
                  totalPages={paginationMeta.totalPages}
                  total={paginationMeta.total}
                  limit={limit}
                  loading={itemsQuery.isFetching}
                  onPageChange={setPage}
                  onLimitChange={updateLimit}
                />
              ) : null}

              <InventoryTransactionHistory item={historyItem} onClose={() => setHistoryItem(null)} />
            </div>
          ) : null}

          {activeTab === 'categories' ? <InventoryCategoriesPanel canManage={canManage} /> : null}
          {activeTab === 'alerts' ? (
            <InventoryAlertsPanel canManage={canManage} onTransaction={openTransactionModal} onHistory={setHistoryItem} />
          ) : null}
        </div>

        <InventoryItemFormModal
          open={showItemModal}
          item={editingItem}
          categories={categories}
          departments={departments}
          defaultCategoryId={categoryId}
          loading={createMutation.isPending || updateMutation.isPending}
          submitError={formError}
          onClose={closeItemModal}
          onSubmit={submitItem}
        />
        <InventoryTransactionModal
          open={Boolean(transactionItem)}
          item={transactionItem}
          departments={departments}
          loading={transactionMutation.isPending}
          submitError={transactionError}
          onClose={closeTransactionModal}
          onSubmit={submitTransaction}
        />
      </Card>
    </div>
  );
}
