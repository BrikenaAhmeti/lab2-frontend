import type { AuthUser } from './authSlice';

export const AUTH_STORAGE_KEY = 'medsphere.auth';

export interface PersistedAuthSession {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export type PersistableAuthSession = {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokens?: {
    accessToken?: string | null;
    refreshToken?: string | null;
  } | null;
  user?: AuthUser | null;
};

function hasStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function toPersistedAuthSession(session: PersistableAuthSession): PersistedAuthSession | null {
  const accessToken = session.accessToken ?? session.tokens?.accessToken ?? null;
  const refreshToken = session.refreshToken ?? session.tokens?.refreshToken ?? undefined;

  if (!accessToken || !session.user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user: session.user,
  };
}

export function readPersistedAuthSession(): PersistedAuthSession | null {
  if (!hasStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    return toPersistedAuthSession(JSON.parse(raw) as PersistableAuthSession);
  } catch {
    return null;
  }
}

export function persistAuthSession(session: PersistableAuthSession) {
  if (!hasStorage()) {
    return;
  }

  const persisted = toPersistedAuthSession(session);
  if (!persisted) {
    clearPersistedAuthSession();
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persisted));
}

export function clearPersistedAuthSession() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
