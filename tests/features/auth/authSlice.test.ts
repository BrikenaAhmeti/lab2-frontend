import { describe, expect, it } from 'vitest';
import reducer, {
  clearSession,
  hydrateSession,
  setAuthLoading,
  setSession,
  setUnauthenticated,
} from '@/features/auth/authSlice';

describe('authSlice', () => {
  it('sets session payload', () => {
    const state = reducer(
      undefined,
      setSession({
        accessToken: 'a1',
        refreshToken: 'r1',
        user: { id: 'u1', email: 'admin@medsphere.com', roles: ['Admin'], permissions: ['users:read'] },
      })
    );

    expect(state.accessToken).toBe('a1');
    expect(state.refreshToken).toBe('r1');
    expect(state.tokens).toEqual({ accessToken: 'a1', refreshToken: 'r1' });
    expect(state.status).toBe('authenticated');
    expect(state.user?.role).toBe('Admin');
  });

  it('hydrates and clears session', () => {
    const hydrated = reducer(
      undefined,
      hydrateSession({
        accessToken: 'a2',
        user: { id: 'u2', email: 'doctor@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
      })
    );
    const cleared = reducer(hydrated, clearSession());

    expect(hydrated.status).toBe('loading');
    expect(cleared.accessToken).toBeNull();
    expect(cleared.user).toBeNull();
    expect(cleared.status).toBe('unauthenticated');
  });

  it('handles loading and unauthenticated transitions', () => {
    const loading = reducer(undefined, setAuthLoading());
    const unauth = reducer(loading, setUnauthenticated());

    expect(loading.status).toBe('loading');
    expect(unauth.status).toBe('unauthenticated');
  });
});
