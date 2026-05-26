import { z } from 'zod';
import { CMS_SECTION_TYPES } from '@/lib/api/cms-api';

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), 'Enter a valid URL')
  .optional();

const contentJson = z.string().superRefine((value, ctx) => {
  if (!value.trim()) {
    return;
  }

  try {
    JSON.parse(value);
  } catch {
    ctx.addIssue({
      code: 'custom',
      message: 'Content must be valid JSON',
    });
  }
});

export const cmsPageFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(160, 'Title is too long'),
  slug: z.string().trim().min(1, 'Slug is required').max(120, 'Slug is too long'),
  metaTitle: z.string().max(160, 'Meta title is too long').optional(),
  metaDescription: z.string().max(255, 'Meta description is too long').optional(),
  isPublished: z.boolean().optional(),
});

export const cmsSectionFormSchema = z.object({
  type: z.enum(CMS_SECTION_TYPES),
  title: z.string().max(160, 'Title is too long').optional(),
  subtitle: z.string().max(255, 'Subtitle is too long').optional(),
  body: z.string().optional(),
  imageUrl: optionalUrl,
  contentJson,
  sortOrder: z
    .number({ error: 'Sort order must be zero or greater' })
    .int('Sort order must be zero or greater')
    .min(0, 'Sort order must be zero or greater')
    .optional(),
  isVisible: z.boolean().optional(),
});

export const cmsBannerFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(160, 'Title is too long'),
  message: z.string().trim().min(1, 'Message is required'),
  imageUrl: optionalUrl,
  linkUrl: optionalUrl,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z
    .number({ error: 'Sort order must be zero or greater' })
    .int('Sort order must be zero or greater')
    .min(0, 'Sort order must be zero or greater')
    .optional(),
});

export type CmsPageFormValues = z.infer<typeof cmsPageFormSchema>;
export type CmsSectionFormValues = z.infer<typeof cmsSectionFormSchema>;
export type CmsBannerFormValues = z.infer<typeof cmsBannerFormSchema>;

export const emptyCmsPageValues: CmsPageFormValues = {
  title: '',
  slug: '',
  metaTitle: '',
  metaDescription: '',
  isPublished: false,
};

export const emptyCmsSectionValues: CmsSectionFormValues = {
  type: 'TEXT',
  title: '',
  subtitle: '',
  body: '',
  imageUrl: '',
  contentJson: '',
  sortOrder: 0,
  isVisible: true,
};

export const emptyCmsBannerValues: CmsBannerFormValues = {
  title: '',
  message: '',
  imageUrl: '',
  linkUrl: '',
  startDate: '',
  endDate: '',
  isActive: true,
  sortOrder: 0,
};
