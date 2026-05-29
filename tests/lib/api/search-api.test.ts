import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { advancedSearchApi } from '@/lib/api/search-api';

function mockClient() {
  return {
    get: vi.fn().mockResolvedValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
  };
}

describe('advancedSearchApi', () => {
  it('uses the backend search base path and q parameter', async () => {
    const instance = mockClient();
    const params = {
      q: 'Arta',
      page: 2,
      limit: 5,
      bloodType: 'A_POSITIVE',
      sortBy: 'lastName',
      sortOrder: 'asc' as const,
    };

    await advancedSearchApi.search('patients', params, instance);

    expect(instance.get).toHaveBeenCalledWith('/api/search/patients', { params });
    expect(instance.get).not.toHaveBeenCalledWith(expect.any(String), {
      params: expect.objectContaining({ search: 'Arta' }),
    });
  });
});
