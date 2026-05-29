import { z } from 'zod';

export const reportTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Template name must be at least 2 characters')
    .max(120, 'Template name must be at most 120 characters'),
  description: z.string().trim().max(1000, 'Description must be at most 1000 characters').optional().or(z.literal('')),
});

export type ReportTemplateFormValues = z.infer<typeof reportTemplateSchema>;

export const emptyReportTemplateValues: ReportTemplateFormValues = {
  name: '',
  description: '',
};
