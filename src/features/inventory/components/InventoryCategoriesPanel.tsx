import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { InventoryCategory } from '@/lib/api/inventory-api';
import {
  emptyInventoryCategoryFormValues,
  inventoryCategoryFormSchema,
  type ActiveStatus,
  type InventoryCategoryFormValues,
} from '@/features/inventory/inventory.schemas';
import {
  getInventoryApiErrorMessage,
  toInventoryCategoryFormValues,
  toInventoryCategoryPayload,
  useCreateInventoryCategory,
  useDeactivateInventoryCategory,
  useInventoryCategories,
  useUpdateInventoryCategory,
} from '@/features/inventory/hooks/useInventory';

interface InventoryCategoriesPanelProps {
  canManage: boolean;
}

interface CategoryFormModalProps {
  open: boolean;
  category: InventoryCategory | null;
  categories: InventoryCategory[];
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: InventoryCategoryFormValues) => void;
}

const selectClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';

function CategoryFormModal({
  open,
  category,
  categories,
  loading,
  submitError,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryCategoryFormValues>({
    resolver: zodResolver(inventoryCategoryFormSchema),
    defaultValues: emptyInventoryCategoryFormValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(category ? toInventoryCategoryFormValues(category) : emptyInventoryCategoryFormValues);
  }, [category, open, reset]);

  if (!open) return null;

  const parentOptions = categories.filter((option) => option.id !== category?.id);

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-2xl p-5">
        <h3 className="text-lg font-semibold text-foreground">{category ? 'Edit category' : 'Add category'}</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input id="inventory-category-name" label="Name" disabled={loading} error={errors.name?.message} {...register('name')} />
            <label htmlFor="inventory-category-parent" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Parent</span>
              <select id="inventory-category-parent" disabled={loading} className={selectClass} {...register('parentId')}>
                <option value="">No parent</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground md:col-span-2">
              <input type="checkbox" className="h-4 w-4 rounded border-border" disabled={loading} {...register('isActive')} />
              Active
            </label>
            <label htmlFor="inventory-category-description" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <textarea
                id="inventory-category-description"
                disabled={loading}
                className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('description')}
              />
              {errors.description ? <p className="text-xs text-danger">{errors.description.message}</p> : null}
            </label>
          </div>
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {category ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryCategoriesPanel({ canManage }: InventoryCategoriesPanelProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveStatus>('active');
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState('');

  const params = useMemo(
    () => ({
      page: 1,
      limit: 100,
      search: search.trim() || undefined,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
    }),
    [activeFilter, search]
  );
  const categoriesQuery = useInventoryCategories(params);
  const createMutation = useCreateInventoryCategory();
  const updateMutation = useUpdateInventoryCategory();
  const deactivateMutation = useDeactivateInventoryCategory();
  const categories = categoriesQuery.data?.items ?? [];
  const mutationPending = createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending;

  const openCreateModal = () => {
    setFeedback(null);
    setFormError('');
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEditModal = (category: InventoryCategory) => {
    setFeedback(null);
    setFormError('');
    setEditingCategory(category);
    setShowModal(true);
  };

  const closeModal = () => {
    setFormError('');
    setEditingCategory(null);
    setShowModal(false);
  };

  const submitCategory = async (values: InventoryCategoryFormValues) => {
    setFeedback(null);
    setFormError('');
    const payload = toInventoryCategoryPayload(values);

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ id: editingCategory.id, payload });
        setFeedback({ type: 'success', message: 'Category updated successfully' });
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback({ type: 'success', message: 'Category created successfully' });
      }
      closeModal();
    } catch (error) {
      setFormError(getInventoryApiErrorMessage(error, 'Category could not be saved'));
    }
  };

  const deactivateCategory = async (category: InventoryCategory) => {
    if (!window.confirm(`Deactivate ${category.name}?`)) return;

    setFeedback(null);
    try {
      await deactivateMutation.mutateAsync(category.id);
      setFeedback({ type: 'success', message: 'Category deactivated successfully' });
    } catch (error) {
      setFeedback({ type: 'error', message: getInventoryApiErrorMessage(error, 'Category could not be deactivated') });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <Input id="inventory-category-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" />
          <label htmlFor="inventory-category-status" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Active</span>
            <select id="inventory-category-status" value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as ActiveStatus)} className={selectClass}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        {canManage ? (
          <Button type="button" size="sm" onClick={openCreateModal}>
            Add Category
          </Button>
        ) : null}
      </div>

      {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}
      {categoriesQuery.isLoading ? <p className="text-sm text-muted">Loading categories...</p> : null}
      {categoriesQuery.isError ? <FeedbackMessage type="error" message="Categories could not be loaded" /> : null}
      {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">No categories found.</p>
      ) : null}

      {categories.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{category.name}</p>
                    {category.description ? <p className="mt-1 text-xs text-muted">{category.description}</p> : null}
                  </td>
                  <td className="px-4 py-3">{category.parent?.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={category.isActive ? 'success' : 'neutral'}>{category.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => openEditModal(category)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => deactivateCategory(category)}>
                          Deactivate
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <CategoryFormModal
        open={showModal}
        category={editingCategory}
        categories={categories}
        loading={createMutation.isPending || updateMutation.isPending}
        submitError={formError}
        onClose={closeModal}
        onSubmit={submitCategory}
      />
    </section>
  );
}
