import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  buildCmsBannerPayload,
  buildCmsPagePayload,
  buildCmsSectionPayload,
  cmsApi,
} from '@/lib/api/cms-api';

function mockClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { id: 'created' } }),
    put: vi.fn().mockResolvedValue({ data: { id: 'updated' } }),
    patch: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn().mockResolvedValue({ data: undefined }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe('CMS API helpers', () => {
  it('builds a page payload with trimmed optional fields', () => {
    expect(
      buildCmsPagePayload({
        title: ' Home ',
        slug: ' home ',
        metaTitle: ' ',
        metaDescription: ' Care near you ',
        isPublished: true,
      })
    ).toEqual({
      title: 'Home',
      slug: 'home',
      metaTitle: null,
      metaDescription: 'Care near you',
      isPublished: true,
    });
  });

  it('builds a section payload with parsed content JSON', () => {
    expect(
      buildCmsSectionPayload({
        type: 'FAQ',
        title: ' Questions ',
        contentJson: '{"items":[{"question":"Hours?","answer":"Open daily"}]}',
        isVisible: true,
      })
    ).toEqual({
      type: 'FAQ',
      title: 'Questions',
      subtitle: null,
      body: null,
      imageUrl: null,
      content: {
        items: [{ question: 'Hours?', answer: 'Open daily' }],
      },
      sortOrder: 0,
      isVisible: true,
    });
  });

  it('posts sections and reorders with the CMS service routes', async () => {
    const instance = mockClient();
    const sectionPayload = buildCmsSectionPayload({ type: 'TEXT', title: 'Intro' });
    const reorderPayload = [{ id: 'section-1', sortOrder: 0 }];

    await cmsApi.createSection('page-1', sectionPayload, instance);
    await cmsApi.reorderSections('page-1', reorderPayload, instance);

    expect(instance.post).toHaveBeenCalledWith('/api/cms/pages/page-1/sections', sectionPayload);
    expect(instance.patch).toHaveBeenCalledWith('/api/cms/pages/page-1/sections/reorder', {
      sections: reorderPayload,
    });
  });

  it('builds and posts banner scheduling payloads', async () => {
    const instance = mockClient();
    const payload = buildCmsBannerPayload({
      title: ' Spring ',
      message: ' Visit us ',
      startDate: '2026-05-26T09:00',
      endDate: '',
      isActive: true,
      sortOrder: 2,
    });

    await cmsApi.createBanner(payload, instance);

    expect(payload).toMatchObject({
      title: 'Spring',
      message: 'Visit us',
      endDate: null,
      isActive: true,
      sortOrder: 2,
    });
    expect(payload.startDate).toBe(new Date('2026-05-26T09:00').toISOString());
    expect(instance.post).toHaveBeenCalledWith('/api/cms/banners', payload);
  });
});
