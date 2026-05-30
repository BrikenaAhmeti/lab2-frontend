import { z } from 'zod';

export const activeStatusSchema = z.enum(['all', 'active', 'inactive']);

export const inventoryItemFormSchema = z.object({
  categoryId: z.string().uuid('Category is required'),
  departmentId: z.string().optional(),
  sku: z.string().trim().min(1, 'SKU is required').max(80, 'SKU must be at most 80 characters'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160, 'Name must be at most 160 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
  unitOfMeasure: z.string().trim().min(1, 'Unit is required').max(50, 'Unit must be at most 50 characters'),
  currentStock: z.number({ error: 'Current stock must be zero or greater' }).min(0, 'Current stock must be zero or greater'),
  reorderLevel: z.number({ error: 'Reorder level must be zero or greater' }).min(0, 'Reorder level must be zero or greater'),
  unitCost: z.number({ error: 'Unit cost must be zero or greater' }).min(0, 'Unit cost must be zero or greater').optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const inventoryCategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(120, 'Category name must be at most 120 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const inventoryTransactionFormSchema = z
  .object({
    type: z.enum(['in', 'out', 'adjustment', 'transfer']),
    quantity: z.number({ error: 'Quantity must be zero or greater' }).min(0, 'Quantity must be zero or greater'),
    reason: z.string().trim().min(1, 'Reason is required').max(1000, 'Reason must be at most 1000 characters'),
    unitCost: z.number({ error: 'Unit cost must be zero or greater' }).min(0, 'Unit cost must be zero or greater').optional(),
    batchNumber: z.string().max(100, 'Batch number must be at most 100 characters').optional().or(z.literal('')),
    expiryDate: z.string().optional(),
    targetDepartmentId: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.type !== 'adjustment' && values.quantity <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Quantity must be greater than zero',
      });
    }

    if (values.type === 'transfer' && !values.targetDepartmentId) {
      ctx.addIssue({
        code: 'custom',
        path: ['targetDepartmentId'],
        message: 'Target department is required',
      });
    }
  });

export type ActiveStatus = z.infer<typeof activeStatusSchema>;
export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;
export type InventoryCategoryFormValues = z.infer<typeof inventoryCategoryFormSchema>;
export type InventoryTransactionFormValues = z.infer<typeof inventoryTransactionFormSchema>;

export const emptyInventoryItemFormValues: InventoryItemFormValues = {
  categoryId: '',
  departmentId: '',
  sku: '',
  name: '',
  description: '',
  unitOfMeasure: '',
  currentStock: 0,
  reorderLevel: 0,
  unitCost: undefined,
  expiryDate: '',
  isActive: true,
};

export const emptyInventoryCategoryFormValues: InventoryCategoryFormValues = {
  name: '',
  description: '',
  parentId: '',
  isActive: true,
};

export const emptyInventoryTransactionFormValues: InventoryTransactionFormValues = {
  type: 'in',
  quantity: 1,
  reason: '',
  unitCost: undefined,
  batchNumber: '',
  expiryDate: '',
  targetDepartmentId: '',
};
