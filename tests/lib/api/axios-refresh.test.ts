import { beforeEach, describe, expect, it } from 'vitest';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { apiClient, rawClient, setupAxiosInterceptors } from '@/lib/api/axios';

function makeResponse<T>(cfg: any, status: number, data: T): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : 'Error',
    headers: {},
    config: cfg,
  };
}

function makeAxios401(cfg: any) {
  const response = makeResponse(cfg, 401, {});
  return {
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    config: cfg,
    response,
    isAxiosError: true,
    toJSON: () => ({}),
  };
}

describe('axios refresh interceptor', () => {
  beforeEach(() => {
    setupAxiosInterceptors(store);
    store.dispatch(clearSession());
    localStorage.setItem(
      'medsphere.auth',
      JSON.stringify({
        accessToken: 'old_access',
        refreshToken: 'refresh_1',
        user: { id: 'u1', email: 'admin@medsphere.com', roles: ['Admin'], permissions: ['users:read'] },
      })
    );
  });

  it('refreshes token and retries original request', async () => {
    store.dispatch(
      setSession({
        accessToken: 'old_access',
        refreshToken: 'refresh_1',
        user: { id: 'u1', email: 'admin@medsphere.com', roles: ['Admin'], permissions: ['users:read'] },
      })
    );

    let protectedCalls = 0;
    const originalApiAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
    const originalRawAdapter = rawClient.defaults.adapter as AxiosAdapter | undefined;

    apiClient.defaults.adapter = async (cfg) => {
      if (String(cfg.url).includes('/api/protected')) {
        protectedCalls += 1;
        if (protectedCalls === 1) {
          return Promise.reject(makeAxios401(cfg));
        }
        return makeResponse(cfg, 200, { ok: true });
      }
      return makeResponse(cfg, 200, {});
    };

    rawClient.defaults.adapter = async (cfg) => {
      if (String(cfg.url).includes('/api/auth/refresh')) {
        return makeResponse(cfg, 200, {
          accessToken: 'new_access',
          refreshToken: 'refresh_2',
          user: { id: 'u1', email: 'admin@medsphere.com', roles: ['Admin'], permissions: ['users:read'] },
        });
      }
      return makeResponse(cfg, 200, {});
    };

    const response = await apiClient.get('/api/protected');

    expect(protectedCalls).toBe(2);
    expect(response.data.ok).toBe(true);
    expect(store.getState().auth.accessToken).toBe('new_access');

    apiClient.defaults.adapter = originalApiAdapter;
    rawClient.defaults.adapter = originalRawAdapter;
  });

  it('clears auth state when refresh fails', async () => {
    store.dispatch(
      setSession({
        accessToken: 'old_access',
        refreshToken: 'refresh_1',
        user: { id: 'u1', email: 'admin@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
      })
    );

    const originalApiAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
    const originalRawAdapter = rawClient.defaults.adapter as AxiosAdapter | undefined;

    apiClient.defaults.adapter = async (cfg) => {
      if (String(cfg.url).includes('/api/protected')) {
        return Promise.reject(makeAxios401(cfg));
      }
      return makeResponse(cfg, 200, {});
    };

    rawClient.defaults.adapter = async (cfg) => {
      if (String(cfg.url).includes('/api/auth/refresh')) {
        return Promise.reject(makeAxios401(cfg));
      }
      return makeResponse(cfg, 200, {});
    };

    await expect(apiClient.get('/api/protected')).rejects.toBeTruthy();

    expect(store.getState().auth.accessToken).toBeNull();
    expect(localStorage.getItem('medsphere.auth')).toBeNull();

    apiClient.defaults.adapter = originalApiAdapter;
    rawClient.defaults.adapter = originalRawAdapter;
  });
});
