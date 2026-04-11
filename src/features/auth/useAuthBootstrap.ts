import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi } from '@/lib/api/auth-api';
import {
  clearSession,
  hydrateSession,
  setAuthLoading,
  setSession,
  setUnauthenticated,
} from './authSlice';

const AUTH_STORAGE_KEY = 'medsphere.auth';

interface StoredAuth {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    roles: string[];
    permissions: string[];
  } | null;
}

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isUser(v: unknown): v is StoredAuth['user'] {
  if (!v || typeof v !== 'object') return false;
  const rec = v as Record<string, unknown>;
  return (
    isString(rec.id) &&
    isString(rec.email) &&
    Array.isArray(rec.roles) &&
    rec.roles.every((r) => typeof r === 'string') &&
    Array.isArray(rec.permissions) &&
    rec.permissions.every((p) => typeof p === 'string')
  );
}

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const accessToken = isString(parsed.accessToken) ? parsed.accessToken : null;
    const refreshToken = isString(parsed.refreshToken) ? parsed.refreshToken : null;
    const user = isUser(parsed.user) ? parsed.user : null;
    if (!accessToken && !refreshToken && !user) return null;
    return { accessToken, refreshToken, user };
  } catch {
    return null;
  }
}

function persistAuth(payload: StoredAuth | null) {
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const stored = readStoredAuth();
      if (!stored) {
        dispatch(setUnauthenticated());
        return;
      }

      dispatch(hydrateSession(stored));
      dispatch(setAuthLoading());

      try {
        const me = await authApi.me();
        if (!mounted) return;

        if (stored.accessToken && stored.refreshToken) {
          dispatch(
            setSession({
              accessToken: stored.accessToken,
              refreshToken: stored.refreshToken,
              user: me,
            })
          );
          persistAuth({
            accessToken: stored.accessToken,
            refreshToken: stored.refreshToken,
            user: me,
          });
        } else {
          dispatch(setUnauthenticated());
        }
      } catch {
        if (!mounted) return;
        dispatch(clearSession());
        persistAuth(null);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return { bootstrapping: status === 'idle' || status === 'loading' };
}

export function persistSession(payload: { accessToken: string; refreshToken: string; user: StoredAuth['user'] }) {
  persistAuth(payload);
}

export function clearPersistedSession() {
  persistAuth(null);
}
