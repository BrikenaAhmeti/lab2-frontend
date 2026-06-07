import { z } from 'zod';

export const serviceCatalogFiltersSchema = z.object({
  search: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
  isActive: z.enum(['all', 'active', 'inactive']).default('all'),
});

export const serviceFormSchema = z.object({
  departmentId: z.string().uuid('Department is required'),
  name: z
    .string()
    .trim()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be at most 100 characters'),
  description: z
    .string()
    .max(255, 'Description must be at most 255 characters')
    .optional()
    .or(z.literal('')),
  defaultDurationMinutes: z
    .number({ error: 'Duration must be a positive whole number' })
    .int('Duration must be a positive whole number')
    .positive('Duration must be a positive whole number'),
  defaultPrice: z.number({ error: 'Estimated fee must be zero or greater' }).min(0, 'Estimated fee must be zero or greater'),
  isActive: z.boolean().optional(),
  sortOrder: z
    .number({ error: 'Sort order must be zero or greater' })
    .int('Sort order must be zero or greater')
    .min(0, 'Sort order must be zero or greater')
    .optional(),
});

export type ServiceCatalogFilters = z.infer<typeof serviceCatalogFiltersSchema>;
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const emptyServiceFormValues: ServiceFormValues = {
  departmentId: '',
  name: '',
  description: '',
  defaultDurationMinutes: 30,
  defaultPrice: 0,
  isActive: true,
  sortOrder: 0,
};
