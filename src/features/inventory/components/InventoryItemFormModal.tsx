import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { CheckCircle2 } from 'lucide-react';
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
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';

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
    setValue,
    watch,
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
  const expiryDate = watch('expiryDate') ?? '';
  const isActive = watch('isActive') ?? true;

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
            <CalendarDatePicker
              id="inventory-item-expiry"
              label="Expiry date"
              value={expiryDate}
              disabled={loading}
              onChange={(value) => setValue('expiryDate', value, { shouldDirty: true, shouldValidate: true })}
            />
            <label
              className={clsx(
                'flex min-h-[42px] items-center gap-3 self-end rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border bg-background text-muted'
              )}
            >
              <span
                className={clsx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                  isActive ? 'bg-success/15 text-success' : 'bg-surface text-muted'
                )}
                aria-hidden="true"
              >
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{isActive ? 'Active' : 'Inactive'}</span>
                <span className={clsx('block text-xs', isActive ? 'text-success/80' : 'text-muted')}>
                  {isActive ? 'Available in inventory' : 'Hidden from active lists'}
                </span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-border accent-primary"
                disabled={loading}
                {...register('isActive')}
              />
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
