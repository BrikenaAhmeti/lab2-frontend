import { describe, expect, it } from 'vitest';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { apiClient } from '@/lib/api/axios';
import { authApi } from '@/lib/api/auth-api';

function makeResponse<T>(cfg: any, status: number, data: T): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: cfg,
  };
}

describe('authApi', () => {
  it('sends username credentials using the backend login identifier field', async () => {
    const originalAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
    let requestBody: unknown;

    apiClient.defaults.adapter = async (cfg) => {
      requestBody = JSON.parse(String(cfg.data));
      return makeResponse(cfg, 200, {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'admin@medsphere.local',
          roles: ['Super Admin'],
          permissions: [],
        },
      });
    };

    await authApi.login({ username: 'admin', password: 'Admin1234!Pass' });

    expect(requestBody).toEqual({
      email: 'admin',
      password: 'Admin1234!Pass',
    });

    apiClient.defaults.adapter = originalAdapter;
  });
});
