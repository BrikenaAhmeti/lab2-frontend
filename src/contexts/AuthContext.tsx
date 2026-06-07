import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi, type LoginRequest } from '@/lib/api/auth-api';
import { rawClient } from '@/lib/api/axios';
import { clearSession, setSession, type AuthUser } from '@/features/auth/authSlice';
import {
  clearPersistedAuthSession,
  persistAuthSession,
  readPersistedAuthSession,
} from '@/features/auth/authStorage';

interface AuthContextValue {
  currentUser: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, accessToken, refreshToken, tokens, status } = useAppSelector((state) => state.auth);

  const refreshSession = useCallback(async () => {
    const nextRefreshToken = refreshToken ?? tokens?.refreshToken ?? readPersistedAuthSession()?.refreshToken;
    if (!nextRefreshToken) {
      dispatch(clearSession());
      clearPersistedAuthSession();
      return null;
    }

    try {
      const refreshed = await authApi.refresh(nextRefreshToken, rawClient);
      const session = { ...refreshed, refreshToken: refreshed.refreshToken ?? nextRefreshToken };
      dispatch(setSession(session));
      persistAuthSession(session);
      return refreshed.user;
    } catch {
      dispatch(clearSession());
      clearPersistedAuthSession();
      return null;
    }
  }, [dispatch, refreshToken, tokens?.refreshToken]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await authApi.login(payload);
      dispatch(setSession(session));
      persistAuthSession(session);
      return session.user;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    const nextRefreshToken = refreshToken ?? tokens?.refreshToken ?? readPersistedAuthSession()?.refreshToken;
    try {
      await authApi.logout(nextRefreshToken ?? undefined, rawClient);
    } finally {
      dispatch(clearSession());
      clearPersistedAuthSession();
    }
  }, [dispatch, refreshToken, tokens?.refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: user,
      permissions: user?.permissions ?? [],
      isAuthenticated: Boolean(accessToken && user),
      isLoading: status === 'idle' || status === 'loading',
      login,
      logout,
      refreshSession,
    }),
    [accessToken, login, logout, refreshSession, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
