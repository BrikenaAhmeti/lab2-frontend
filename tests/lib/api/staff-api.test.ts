import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { staffApi } from '@/lib/api/staff-api';

function mockClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
  };
}

describe('staffApi', () => {
  it('normalizes lower-case staff status filters to backend enum values', async () => {
    const instance = mockClient();

    await staffApi.list({ page: 1, limit: 50, status: 'active' }, instance);
    await staffApi.publicList({ page: 1, limit: 50, status: 'inactive' }, instance);

    expect(instance.get).toHaveBeenNthCalledWith(1, '/api/staff', {
      params: { page: 1, limit: 50, status: 'ACTIVE' },
    });
    expect(instance.get).toHaveBeenNthCalledWith(2, '/api/public/staff', {
      params: { page: 1, limit: 50, status: 'INACTIVE' },
    });
  });

  it('keeps already-valid staff status enum filters unchanged', async () => {
    const instance = mockClient();

    await staffApi.list({ page: 1, limit: 25, status: 'ON_LEAVE' }, instance);

    expect(instance.get).toHaveBeenCalledWith('/api/staff', {
      params: { page: 1, limit: 25, status: 'ON_LEAVE' },
    });
  });
});
