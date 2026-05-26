import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  buildCmsBannerPayload,
  buildCmsPagePayload,
  buildCmsSectionPayload,
  cmsApi,
  type CmsBanner,
  type CmsPage,
  type CmsSection,
  type CmsSectionOrderPayload,
} from '@/lib/api/cms-api';
import type { CmsBannerFormValues, CmsPageFormValues, CmsSectionFormValues } from '@/features/cms/cms.schemas';

export const cmsQueryKeys = {
  all: ['cms'] as const,
  pages: ['cms', 'pages'] as const,
  page: (id: string) => ['cms', 'pages', id] as const,
  sections: (pageId: string) => ['cms', 'pages', pageId, 'sections'] as const,
  banners: ['cms', 'banners'] as const,
  publicPage: (slug: string) => ['cms', 'public-pages', slug] as const,
};

export function useCmsPages() {
  return useQuery({
    queryKey: cmsQueryKeys.pages,
    queryFn: () => cmsApi.listPages(),
    retry: false,
  });
}

export function useCmsPage(id: string) {
  return useQuery({
    queryKey: cmsQueryKeys.page(id),
    queryFn: () => cmsApi.getPage(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCmsSections(pageId: string) {
  return useQuery({
    queryKey: cmsQueryKeys.sections(pageId),
    queryFn: () => cmsApi.listSections(pageId),
    enabled: Boolean(pageId),
    retry: false,
  });
}

export function useCmsBanners() {
  return useQuery({
    queryKey: cmsQueryKeys.banners,
    queryFn: () => cmsApi.listBanners(),
    retry: false,
  });
}

export function usePublicCmsPage(slug: string) {
  return useQuery({
    queryKey: cmsQueryKeys.publicPage(slug),
    queryFn: () => cmsApi.getPublicPage(slug),
    enabled: Boolean(slug),
    retry: false,
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CmsPageFormValues) => cmsApi.createPage(buildCmsPagePayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
    retry: false,
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CmsPageFormValues }) =>
      cmsApi.updatePage(id, buildCmsPagePayload(values)),
    onSuccess: async (page) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.page(page.id) }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publicPage(page.slug) }),
      ]);
    },
    retry: false,
  });
}

export function usePatchCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CmsPage> }) => cmsApi.updatePage(id, values),
    onSuccess: async (page) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.page(page.id) }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publicPage(page.slug) }),
      ]);
    },
    retry: false,
  });
}

export function useDeleteCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cmsApi.deletePage(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages });
    },
    retry: false,
  });
}

export function useCreateCmsSection(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CmsSectionFormValues) => cmsApi.createSection(pageId, buildCmsSectionPayload(values)),
    onSuccess: async () => {
      await invalidatePageSections(queryClient, pageId);
    },
    retry: false,
  });
}

export function useUpdateCmsSection(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CmsSectionFormValues }) =>
      cmsApi.updateSection(pageId, id, buildCmsSectionPayload(values)),
    onSuccess: async () => {
      await invalidatePageSections(queryClient, pageId);
    },
    retry: false,
  });
}

export function useToggleCmsSection(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      cmsApi.toggleSectionVisibility(pageId, id, isVisible),
    onSuccess: async () => {
      await invalidatePageSections(queryClient, pageId);
    },
    retry: false,
  });
}

export function useReorderCmsSections(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sections: CmsSectionOrderPayload[]) => cmsApi.reorderSections(pageId, sections),
    onSuccess: async () => {
      await invalidatePageSections(queryClient, pageId);
    },
    retry: false,
  });
}

export function useDeleteCmsSection(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cmsApi.deleteSection(pageId, id),
    onSuccess: async () => {
      await invalidatePageSections(queryClient, pageId);
    },
    retry: false,
  });
}

export function useCreateCmsBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CmsBannerFormValues) => cmsApi.createBanner(buildCmsBannerPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.banners });
    },
    retry: false,
  });
}

export function useUpdateCmsBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CmsBannerFormValues }) =>
      cmsApi.updateBanner(id, buildCmsBannerPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.banners });
    },
    retry: false,
  });
}

export function usePatchCmsBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CmsBanner> }) => cmsApi.updateBanner(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.banners });
    },
    retry: false,
  });
}

export function useDeleteCmsBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cmsApi.deleteBanner(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.banners });
    },
    retry: false,
  });
}

export function toPageFormValues(page: CmsPage): CmsPageFormValues {
  return {
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle ?? '',
    metaDescription: page.metaDescription ?? '',
    isPublished: page.isPublished,
  };
}

export function toSectionFormValues(section: CmsSection): CmsSectionFormValues {
  return {
    type: section.type,
    title: section.title ?? '',
    subtitle: section.subtitle ?? '',
    body: section.body ?? '',
    imageUrl: section.imageUrl ?? '',
    contentJson: section.content ? JSON.stringify(section.content, null, 2) : '',
    sortOrder: section.sortOrder,
    isVisible: section.isVisible,
  };
}

export function toBannerFormValues(banner: CmsBanner): CmsBannerFormValues {
  return {
    title: banner.title,
    message: banner.message,
    imageUrl: banner.imageUrl ?? '',
    linkUrl: banner.linkUrl ?? '',
    startDate: toDateTimeLocal(banner.startDate),
    endDate: toDateTimeLocal(banner.endDate),
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
  };
}

export function cmsErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error.response?.status === 401) {
      return 'CMS editor credentials are missing';
    }

    if (error.response?.status === 403) {
      return 'CMS edit permission is required';
    }

    if (error.response?.status === 404) {
      return 'CMS item could not be found';
    }

    if (error.response?.status === 409) {
      return 'This CMS slug already exists';
    }
  }

  return fallback;
}

export function getBannerScheduleStatus(banner: Pick<CmsBanner, 'isActive' | 'startDate' | 'endDate'>) {
  const now = Date.now();
  const start = banner.startDate ? new Date(banner.startDate).getTime() : null;
  const end = banner.endDate ? new Date(banner.endDate).getTime() : null;

  if (!banner.isActive) {
    return { label: 'Inactive', variant: 'neutral' as const };
  }

  if (start && start > now) {
    return { label: 'Scheduled', variant: 'info' as const };
  }

  if (end && end < now) {
    return { label: 'Expired', variant: 'warning' as const };
  }

  return { label: 'Live', variant: 'success' as const };
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

async function invalidatePageSections(queryClient: ReturnType<typeof useQueryClient>, pageId: string) {
  const page = queryClient.getQueryData<CmsPage>(cmsQueryKeys.page(pageId));

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: cmsQueryKeys.page(pageId) }),
    queryClient.invalidateQueries({ queryKey: cmsQueryKeys.sections(pageId) }),
    queryClient.invalidateQueries({ queryKey: cmsQueryKeys.pages }),
    page?.slug
      ? queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publicPage(page.slug) })
      : Promise.resolve(),
  ]);
}
