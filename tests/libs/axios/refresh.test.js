import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { api } from '@/libs/axios/client';
import { store } from '@/app/store';
import { setSession, clearSession } from '@/domain/auth/authSlice';
const mockUser = { id: '1', email: 'a@b.com', name: 'A', role: 'admins' };
function makeResponse(cfg, status, data) {
    return {
        data,
        status,
        statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : '',
        headers: {},
        config: cfg,
    };
}
// stable absolute url (handles baseURL + url)
function fullUrl(cfg) {
    const base = (cfg.baseURL ?? '').toString();
    const url = (cfg.url ?? '').toString();
    try {
        return new URL(url, base || 'http://local.test').toString();
    }
    catch {
        return `${base}${url}`;
    }
}
// create a minimal Axios-like error object that interceptors understand
function makeAxios401(cfg) {
    const res = makeResponse(cfg, 401, {});
    return {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 401',
        config: cfg,
        response: res,
        toJSON() { return {}; }
    };
}
describe('axios refresh', () => {
    beforeEach(() => {
        store.dispatch(clearSession());
    });
    it('retries original request after refresh', async () => {
        store.dispatch(setSession({ user: mockUser, tokens: { accessToken: 'old', refreshToken: 'ref' } }));
        let protectedCalls = 0;
        // INSTANCE adapter
        const originalCoreAdapter = api.core.defaults.adapter;
        api.core.defaults.adapter = async (cfg) => {
            const url = fullUrl(cfg);
            if (url.includes('/protected')) {
                protectedCalls += 1;
                if (protectedCalls === 1) {
                    // **reject** with an Axios-like 401 error to trigger the interceptor path
                    return Promise.reject(makeAxios401(cfg));
                }
                // After refresh, succeed
                return makeResponse(cfg, 200, { ok: true });
            }
            return makeResponse(cfg, 200, {});
        };
        // GLOBAL adapter (used by axios.post('<core>/auth/refresh'))
        const originalGlobalAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (cfg) => {
            const url = fullUrl(cfg);
            if (url.includes('/auth/refresh')) {
                return makeResponse(cfg, 200, {
                    user: mockUser,
                    tokens: { accessToken: 'new', refreshToken: 'ref' },
                });
            }
            return makeResponse(cfg, 200, {});
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
