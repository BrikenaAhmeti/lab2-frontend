import clsx from 'clsx';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { InventoryItem, InventoryTransactionKind } from '@/lib/api/inventory-api';
import {
  emptyInventoryTransactionFormValues,
  inventoryTransactionFormSchema,
  type InventoryTransactionFormValues,
} from '@/features/inventory/inventory.schemas';
import { formatInventoryNumber } from '@/features/inventory/hooks/useInventory';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';

interface InventoryTransactionModalProps {
  open: boolean;
  item: InventoryItem | null;
  departments: DepartmentRecord[];
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: InventoryTransactionFormValues) => void;
}

const transactionTypes: Array<{ type: InventoryTransactionKind; label: string }> = [
  { type: 'in', label: 'Receive Stock' },
  { type: 'out', label: 'Remove Stock' },
  { type: 'adjustment', label: 'Adjust Stock' },
  { type: 'transfer', label: 'Transfer' },
];

const selectClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';

export default function InventoryTransactionModal({
  open,
  item,
  departments,
  loading,
  submitError,
  onClose,
  onSubmit,
}: InventoryTransactionModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InventoryTransactionFormValues>({
    resolver: zodResolver(inventoryTransactionFormSchema),
    defaultValues: emptyInventoryTransactionFormValues,
  });
  const selectedType = watch('type');
  const expiryDate = watch('expiryDate') ?? '';

  useEffect(() => {
    if (open) {
      reset(emptyInventoryTransactionFormValues);
    }
  }, [open, reset]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-2xl p-5">
        <h3 className="text-lg font-semibold text-foreground">Record stock transaction</h3>
        <p className="mt-1 text-sm text-muted">
          {item.name} has {formatInventoryNumber(item.currentStock)} {item.unitOfMeasure} in stock.
        </p>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Transaction type</p>
            <div className="grid gap-2 sm:grid-cols-4">
              {transactionTypes.map((transaction) => (
                <button
                  key={transaction.type}
                  type="button"
                  disabled={loading}
                  className={clsx(
                    'rounded-xl border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
                    selectedType === transaction.type
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-surface'
                  )}
                  onClick={() => setValue('type', transaction.type, { shouldValidate: true })}
                >
                  {transaction.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="inventory-transaction-quantity"
              label={selectedType === 'adjustment' ? 'New stock quantity' : 'Quantity'}
              type="number"
              step="0.01"
              disabled={loading}
              error={errors.quantity?.message}
              {...register('quantity', { valueAsNumber: true })}
            />
            {selectedType === 'transfer' ? (
              <label htmlFor="inventory-transaction-target-department" className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Target department</span>
                <select id="inventory-transaction-target-department" disabled={loading} className={selectClass} {...register('targetDepartmentId')}>
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {errors.targetDepartmentId ? <p className="text-xs text-danger">{errors.targetDepartmentId.message}</p> : null}
              </label>
            ) : null}
            {selectedType === 'in' ? (
              <>
                <Input
                  id="inventory-transaction-unit-cost"
                  label="Unit cost"
                  type="number"
                  step="0.01"
                  disabled={loading}
                  error={errors.unitCost?.message}
                  {...register('unitCost', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
                />
                <Input id="inventory-transaction-batch" label="Batch number" disabled={loading} error={errors.batchNumber?.message} {...register('batchNumber')} />
                <CalendarDatePicker
                  id="inventory-transaction-expiry"
                  label="Expiry date"
                  value={expiryDate}
                  disabled={loading}
                  error={errors.expiryDate?.message}
                  onChange={(value) => setValue('expiryDate', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                />
              </>
            ) : null}
            <label htmlFor="inventory-transaction-reason" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Reason</span>
              <textarea
                id="inventory-transaction-reason"
                disabled={loading}
                className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('reason')}
              />
              {errors.reason ? <p className="text-xs text-danger">{errors.reason.message}</p> : null}
            </label>
          </div>
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Record transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
