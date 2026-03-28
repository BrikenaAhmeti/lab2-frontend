import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { api } from '@/libs/axios/client';
import { store } from '@/app/store';
import { setSession, clearSession } from '@/domain/auth/authSlice';
import type { AuthUser } from '@/domain/auth/types';

const mockUser: AuthUser = { id: '1', email: 'a@b.com', name: 'A', role: 'admins' };

function makeResponse<T>(cfg: any, status: number, data: T): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : '',
    headers: {},
    config: cfg,
  };
}

// stable absolute url (handles baseURL + url)
function fullUrl(cfg: any) {
  const base = (cfg.baseURL ?? '').toString();
  const url = (cfg.url ?? '').toString();
  try {
    return new URL(url, base || 'http://local.test').toString();
  } catch {
    return `${base}${url}`;
  }
}

// create a minimal Axios-like error object that interceptors understand
function makeAxios401(cfg: any) {
  const res = makeResponse(cfg, 401, {} as any);
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    config: cfg,
    response: res,
    toJSON() { return {}; }
  } as any;
}

describe('axios refresh', () => {
  beforeEach(() => {
    store.dispatch(clearSession());
  });

  it('retries original request after refresh', async () => {
    store.dispatch(
      setSession({ user: mockUser, tokens: { accessToken: 'old', refreshToken: 'ref' } })
    );

    let protectedCalls = 0;

    // INSTANCE adapter
    const originalCoreAdapter = api.core.defaults.adapter as AxiosAdapter | undefined;
    api.core.defaults.adapter = async (cfg) => {
      const url = fullUrl(cfg);

      if (url.includes('/protected')) {
        protectedCalls += 1;

        if (protectedCalls === 1) {
          // **reject** with an Axios-like 401 error to trigger the interceptor path
          return Promise.reject(makeAxios401(cfg));
        }
        // After refresh, succeed
        return makeResponse(cfg, 200, { ok: true } as any);
      }

      return makeResponse(cfg, 200, {} as any);
    };

    // GLOBAL adapter (used by axios.post('<core>/auth/refresh'))
    const originalGlobalAdapter = axios.defaults.adapter as AxiosAdapter | undefined;
    axios.defaults.adapter = async (cfg) => {
      const url = fullUrl(cfg);
      if (url.includes('/auth/refresh')) {
        return makeResponse(cfg, 200, {
          user: mockUser,
          tokens: { accessToken: 'new', refreshToken: 'ref' },
        } as any);
      }
      return makeResponse(cfg, 200, {} as any);
    };

    const res = await api.core.get('/protected');

    // Assertions
    expect(protectedCalls).toBe(2); // first 401 + retried once after refresh
    expect(store.getState().auth.tokens?.accessToken).toBe('new');
    expect(res?.data?.ok).toBe(true);

    // cleanup
    api.core.defaults.adapter = originalCoreAdapter;
    axios.defaults.adapter = originalGlobalAdapter;
  });
});
