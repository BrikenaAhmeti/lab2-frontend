import { z } from 'zod';

export const staffPositionTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(255, 'Description must be at most 255 characters')
    .optional()
    .or(z.literal('')),
  defaultRoleKey: z
    .string()
    .trim()
    .min(1, 'Default role is required')
    .max(100, 'Default role must be at most 100 characters'),
  applicableDepartmentIds: z.array(z.string().uuid('Department selection is invalid')).optional(),
  isActive: z.boolean().optional(),
});

export type StaffPositionTypeFormValues = z.infer<typeof staffPositionTypeFormSchema>;

export const emptyStaffPositionTypeFormValues: StaffPositionTypeFormValues = {
  name: '',
  description: '',
  defaultRoleKey: '',
  applicableDepartmentIds: [],
  isActive: true,
};
