import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi } from '@/lib/api/auth-api';
import {
  clearSession,
  setAuthLoading,
  setSession,
  setUnauthenticated,
} from './authSlice';

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      dispatch(setAuthLoading());

      try {
        const refreshed = await authApi.refresh();
        if (!mounted) return;
        dispatch(setSession(refreshed));
      } catch {
        if (!mounted) return;
        dispatch(clearSession());
        dispatch(setUnauthenticated());
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return { bootstrapping: status === 'idle' || status === 'loading' };
}

export function persistSession() {
  return;
}

export function clearPersistedSession() {
  return;
}
