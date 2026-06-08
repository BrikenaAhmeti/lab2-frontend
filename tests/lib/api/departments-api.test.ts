import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { departmentsApi } from '@/lib/api/departments-api';

function mockClient(data: unknown) {
  return {
    get: vi.fn().mockResolvedValue({ data }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
  };
}

describe('departmentsApi', () => {
  it('normalizes backend pagination aliases', async () => {
    const instance = mockClient({
      data: [
        {
          id: 'department-1',
          name: 'Primary Care',
          description: null,
          floor: null,
          phoneExtension: null,
          operatingHours: null,
          isActive: true,
          sortOrder: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: {
        page: '2',
        limit: '10',
        totalItems: '21',
        pageCount: '3',
      },
    });

    const response = await departmentsApi.list({ page: 2, limit: 10 }, instance);

    expect(instance.get).toHaveBeenCalledWith('/api/departments', { params: { page: 2, limit: 10 } });
    expect(response.meta).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it('infers one more page when the backend omits totals for a full page', async () => {
    const instance = mockClient({
      items: Array.from({ length: 10 }, (_, index) => ({
        id: `department-${index + 1}`,
        name: `Department ${index + 1}`,
        description: null,
        floor: null,
        phoneExtension: null,
        operatingHours: null,
        isActive: true,
        sortOrder: index + 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      })),
      meta: {
        page: 1,
        limit: 10,
      },
    });

    const response = await departmentsApi.list({ page: 1, limit: 10 }, instance);

    expect(response.meta.totalPages).toBe(2);
    expect(response.meta.total).toBe(11);
  });
});
