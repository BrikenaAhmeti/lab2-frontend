import { useEffect } from 'react';
import { useStore } from 'react-redux';
import type { AppStore } from '@/app/store';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi } from '@/lib/api/auth-api';
import { rawClient } from '@/lib/api/axios';
import { clearSession, setAuthLoading, setSession } from './authSlice';
import {
  clearPersistedAuthSession,
  persistAuthSession,
  readPersistedAuthSession,
} from './authStorage';

type RefreshResponse = Awaited<ReturnType<typeof authApi.refresh>>;

let bootstrapRefreshPromise: { refreshToken: string; promise: Promise<RefreshResponse> } | null = null;

function refreshBootstrapSession(refreshToken: string) {
  if (bootstrapRefreshPromise?.refreshToken === refreshToken) {
    return bootstrapRefreshPromise.promise;
  }

  const promise = authApi
    .refresh(refreshToken, rawClient)
    .finally(() => {
      bootstrapRefreshPromise = null;
    });

  bootstrapRefreshPromise = { refreshToken, promise };
  return promise;
}

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const store = useStore() as AppStore;
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status !== 'idle') {
      return;
    }

    const bootstrap = async () => {
      const persisted = readPersistedAuthSession();
      const initialAuth = store.getState().auth;
      const accessTokenAtStart = initialAuth.accessToken;
      const refreshToken = initialAuth.refreshToken ?? initialAuth.tokens?.refreshToken ?? persisted?.refreshToken;

      if (!refreshToken) {
        dispatch(clearSession());
        clearPersistedAuthSession();
        return;
      }

      dispatch(setAuthLoading());

      try {
        const refreshed = await refreshBootstrapSession(refreshToken);
        if (store.getState().auth.accessToken !== accessTokenAtStart) return;
        dispatch(setSession({ ...refreshed, refreshToken: refreshed.refreshToken ?? refreshToken }));
        persistAuthSession(store.getState().auth);
      } catch {
        if (store.getState().auth.accessToken !== accessTokenAtStart) return;
        dispatch(clearSession());
        clearPersistedAuthSession();
      }
    };

    bootstrap();
  }, [dispatch, status, store]);

  return { bootstrapping: status === 'idle' || status === 'loading' };
}

export function persistSession(session = readPersistedAuthSession()) {
  if (session) {
    persistAuthSession(session);
  }
}

export function clearPersistedSession() {
  clearPersistedAuthSession();
}
