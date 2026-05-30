import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { InventoryCategory, InventoryItem } from '@/lib/api/inventory-api';
import {
  emptyInventoryItemFormValues,
  inventoryItemFormSchema,
  type InventoryItemFormValues,
} from '@/features/inventory/inventory.schemas';
import { toInventoryItemFormValues } from '@/features/inventory/hooks/useInventory';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';

interface InventoryItemFormModalProps {
  open: boolean;
  item: InventoryItem | null;
  categories: InventoryCategory[];
  departments: DepartmentRecord[];
  defaultCategoryId: string;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: InventoryItemFormValues) => void;
}

const selectClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';

export default function InventoryItemFormModal({
  open,
  item,
  categories,
  departments,
  defaultCategoryId,
  loading,
  submitError,
  onClose,
  onSubmit,
}: InventoryItemFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: emptyInventoryItemFormValues,
  });

  useEffect(() => {
    if (!open) return;
    if (item) {
      reset(toInventoryItemFormValues(item));
      return;
    }

    reset({
      ...emptyInventoryItemFormValues,
      categoryId: defaultCategoryId,
    });
  }, [defaultCategoryId, item, open, reset]);

  if (!open) return null;

  const noCategories = categories.length === 0;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
        <h3 className="text-lg font-semibold text-foreground">{item ? 'Edit inventory item' : 'Add inventory item'}</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <label htmlFor="inventory-item-category" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Category</span>
              <select id="inventory-item-category" disabled={noCategories || loading} className={selectClass} {...register('categoryId')}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId ? <p className="text-xs text-danger">{errors.categoryId.message}</p> : null}
            </label>
            <label htmlFor="inventory-item-department" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Department</span>
              <select id="inventory-item-department" disabled={loading} className={selectClass} {...register('departmentId')}>
                <option value="">No department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <Input id="inventory-item-name" label="Name" disabled={loading} error={errors.name?.message} {...register('name')} />
            <Input id="inventory-item-sku" label="SKU" disabled={loading} error={errors.sku?.message} {...register('sku')} />
            <Input id="inventory-item-unit" label="Unit" disabled={loading} error={errors.unitOfMeasure?.message} {...register('unitOfMeasure')} />
            <Input
              id="inventory-item-stock"
              label="Current stock"
              type="number"
              step="0.01"
              disabled={loading}
              error={errors.currentStock?.message}
              {...register('currentStock', { valueAsNumber: true })}
            />
            <Input
              id="inventory-item-reorder"
              label="Reorder level"
              type="number"
              step="0.01"
              disabled={loading}
              error={errors.reorderLevel?.message}
              {...register('reorderLevel', { valueAsNumber: true })}
            />
            <Input
              id="inventory-item-unit-cost"
              label="Unit cost"
              type="number"
              step="0.01"
              disabled={loading}
              error={errors.unitCost?.message}
              {...register('unitCost', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
            />
            <Input id="inventory-item-expiry" label="Expiry date" type="date" disabled={loading} {...register('expiryDate')} />
            <label className="flex items-center gap-2 self-end text-sm font-medium text-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-border" disabled={loading} {...register('isActive')} />
              Active
            </label>
            <label htmlFor="inventory-item-description" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <textarea
                id="inventory-item-description"
                disabled={loading}
                className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('description')}
              />
              {errors.description ? <p className="text-xs text-danger">{errors.description.message}</p> : null}
            </label>
          </div>
          {noCategories ? <p className="text-sm text-muted">Add an active inventory category before creating items.</p> : null}
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={noCategories}>
              {item ? 'Save changes' : 'Create item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
