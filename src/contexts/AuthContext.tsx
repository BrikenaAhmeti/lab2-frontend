import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi, type LoginRequest } from '@/lib/api/auth-api';
import { clearSession, setSession, type AuthUser } from '@/features/auth/authSlice';

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
  const { user, accessToken, status } = useAppSelector((state) => state.auth);

  const refreshSession = useCallback(async () => {
    try {
      const refreshed = await authApi.refresh();
      dispatch(setSession(refreshed));
      return refreshed.user;
    } catch {
      dispatch(clearSession());
      return null;
    }
  }, [dispatch]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await authApi.login(payload);
      dispatch(setSession(session));
      return session.user;
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(clearSession());
    }
  }, [dispatch]);

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
