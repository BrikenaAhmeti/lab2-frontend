import type { AxiosInstance } from 'axios';
import { cmsApiClient } from './axios';

export const CMS_SECTION_TYPES = ['HERO', 'TEXT', 'CTA', 'FAQ', 'TESTIMONIALS', 'STATS'] as const;

export type CmsSectionType = (typeof CMS_SECTION_TYPES)[number];

export interface CmsSection {
  id: string;
  pageId: string;
  type: CmsSectionType;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  content: unknown | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sections?: CmsSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  message: string;
  imageUrl: string | null;
  linkUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPagePayload {
  slug?: string;
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished?: boolean;
}

export interface CmsSectionPayload {
  type: CmsSectionType;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  content?: unknown | null;
  sortOrder?: number;
  isVisible?: boolean;
}

export interface CmsSectionOrderPayload {
  id: string;
  sortOrder: number;
}

export interface CmsBannerPayload {
  title: string;
  message: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

function client(instance?: AxiosInstance) {
  return instance ?? cmsApiClient;
}

export function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildCmsPagePayload(values: {
  slug?: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished?: boolean;
}): CmsPagePayload {
  return {
    slug: values.slug?.trim() || undefined,
    title: values.title.trim(),
    metaTitle: emptyToNull(values.metaTitle),
    metaDescription: emptyToNull(values.metaDescription),
    isPublished: values.isPublished ?? false,
  };
}

export function buildCmsSectionPayload(values: {
  type: CmsSectionType;
  title?: string;
  subtitle?: string;
  body?: string;
  imageUrl?: string;
  contentJson?: string;
  sortOrder?: number;
  isVisible?: boolean;
}): CmsSectionPayload {
  const contentJson = values.contentJson?.trim();

  return {
    type: values.type,
    title: emptyToNull(values.title),
    subtitle: emptyToNull(values.subtitle),
    body: emptyToNull(values.body),
    imageUrl: emptyToNull(values.imageUrl),
    content: contentJson ? JSON.parse(contentJson) : null,
    sortOrder: values.sortOrder ?? 0,
    isVisible: values.isVisible ?? true,
  };
}

export function buildCmsBannerPayload(values: {
  title: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  sortOrder?: number;
}): CmsBannerPayload {
  const startDate = emptyToNull(values.startDate);
  const endDate = emptyToNull(values.endDate);

  return {
    title: values.title.trim(),
    message: values.message.trim(),
    imageUrl: emptyToNull(values.imageUrl),
    linkUrl: emptyToNull(values.linkUrl),
    startDate: startDate ? new Date(startDate).toISOString() : null,
    endDate: endDate ? new Date(endDate).toISOString() : null,
    isActive: values.isActive ?? true,
    sortOrder: values.sortOrder ?? 0,
  };
}

export const cmsApi = {
  listPages(instance?: AxiosInstance) {
    return client(instance).get<CmsPage[]>('/api/cms/pages').then((response) => response.data);
  },
  getPage(id: string, instance?: AxiosInstance) {
    return client(instance).get<CmsPage>(`/api/cms/pages/${id}`).then((response) => response.data);
  },
  createPage(payload: CmsPagePayload, instance?: AxiosInstance) {
    return client(instance).post<CmsPage>('/api/cms/pages', payload).then((response) => response.data);
  },
  updatePage(id: string, payload: Partial<CmsPagePayload>, instance?: AxiosInstance) {
    return client(instance).put<CmsPage>(`/api/cms/pages/${id}`, payload).then((response) => response.data);
  },
  deletePage(id: string, instance?: AxiosInstance) {
    return client(instance).delete<void>(`/api/cms/pages/${id}`).then((response) => response.data);
  },
  listSections(pageId: string, instance?: AxiosInstance) {
    return client(instance).get<CmsSection[]>(`/api/cms/pages/${pageId}/sections`).then((response) => response.data);
  },
  getSection(pageId: string, id: string, instance?: AxiosInstance) {
    return client(instance)
      .get<CmsSection>(`/api/cms/pages/${pageId}/sections/${id}`)
      .then((response) => response.data);
  },
  createSection(pageId: string, payload: CmsSectionPayload, instance?: AxiosInstance) {
    return client(instance)
      .post<CmsSection>(`/api/cms/pages/${pageId}/sections`, payload)
      .then((response) => response.data);
  },
  updateSection(pageId: string, id: string, payload: Partial<CmsSectionPayload>, instance?: AxiosInstance) {
    return client(instance)
      .put<CmsSection>(`/api/cms/pages/${pageId}/sections/${id}`, payload)
      .then((response) => response.data);
  },
  toggleSectionVisibility(pageId: string, id: string, isVisible: boolean, instance?: AxiosInstance) {
    return client(instance)
      .patch<CmsSection>(`/api/cms/pages/${pageId}/sections/${id}/visibility`, { isVisible })
      .then((response) => response.data);
  },
  reorderSections(pageId: string, sections: CmsSectionOrderPayload[], instance?: AxiosInstance) {
    return client(instance)
      .patch<CmsSection[]>(`/api/cms/pages/${pageId}/sections/reorder`, { sections })
      .then((response) => response.data);
  },
  deleteSection(pageId: string, id: string, instance?: AxiosInstance) {
    return client(instance).delete<void>(`/api/cms/pages/${pageId}/sections/${id}`).then((response) => response.data);
  },
  listBanners(instance?: AxiosInstance) {
    return client(instance).get<CmsBanner[]>('/api/cms/banners').then((response) => response.data);
  },
  getBanner(id: string, instance?: AxiosInstance) {
    return client(instance).get<CmsBanner>(`/api/cms/banners/${id}`).then((response) => response.data);
  },
  createBanner(payload: CmsBannerPayload, instance?: AxiosInstance) {
    return client(instance).post<CmsBanner>('/api/cms/banners', payload).then((response) => response.data);
  },
  updateBanner(id: string, payload: Partial<CmsBannerPayload>, instance?: AxiosInstance) {
    return client(instance).put<CmsBanner>(`/api/cms/banners/${id}`, payload).then((response) => response.data);
  },
  deleteBanner(id: string, instance?: AxiosInstance) {
    return client(instance).delete<void>(`/api/cms/banners/${id}`).then((response) => response.data);
  },
  getPublicPage(slug: string, instance?: AxiosInstance) {
    return client(instance).get<CmsPage>(`/api/public/cms/pages/${slug}`).then((response) => response.data);
  },
  listPublicBanners(instance?: AxiosInstance) {
    return client(instance).get<CmsBanner[]>('/api/public/cms/banners').then((response) => response.data);
  },
};
