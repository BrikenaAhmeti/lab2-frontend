import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AppStore } from '@/app/store';
import { authApi } from './auth-api';
import { clearSession, setSession } from '@/features/auth/authSlice';

const baseURL = import.meta.env.VITE_API_CORE || 'http://localhost:3005';
const coreBaseURL = import.meta.env.VITE_API_CORE_SERVICE || 'http://localhost:3007';

const AUTH_STORAGE_KEY = 'medsphere.auth';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type RefreshSubscriber = (token: string) => void;

let isRefreshing = false;
let subscribers: RefreshSubscriber[] = [];
let authStore: AppStore | null = null;

export const apiClient = axios.create({
  baseURL,
  timeout: 20000,
});

export const coreApiClient = axios.create({
  baseURL: coreBaseURL,
  timeout: 20000,
});

export const rawClient = axios.create({
  baseURL,
  timeout: 20000,
});

function notifySubscribers(token: string) {
  const pending = subscribers;
  subscribers = [];
  pending.forEach((cb) => cb(token));
}

function queueSubscriber(cb: RefreshSubscriber) {
  subscribers.push(cb);
}

function setAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

function safePersistClear() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function fallbackToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function refreshTokenFlow(store: AppStore, refreshToken: string) {
  const refreshed = await authApi.refresh(refreshToken, rawClient);
  store.dispatch(setSession(refreshed));
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      user: refreshed.user,
    })
  );
  return refreshed.accessToken;
}

function applyAuthInterceptors(client: typeof apiClient) {
  client.interceptors.request.use((config) => {
    if (!authStore) {
      return config;
    }
    const token = authStore.getState().auth.accessToken;
    if (token) {
      setAuthHeader(config, token);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (!authStore) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const originalRequest = error.config as RetryableConfig | undefined;

      if (!originalRequest || status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = authStore.getState().auth.refreshToken;

      if (!refreshToken) {
        authStore.dispatch(clearSession());
        safePersistClear();
        fallbackToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queueSubscriber((nextToken) => {
            setAuthHeader(originalRequest, nextToken);
            client(originalRequest).then(resolve).catch(reject);
          });
        });
      }

      isRefreshing = true;

      try {
        const nextToken = await refreshTokenFlow(authStore, refreshToken);
        isRefreshing = false;
        notifySubscribers(nextToken);
        setAuthHeader(originalRequest, nextToken);
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        subscribers = [];
        authStore.dispatch(clearSession());
        safePersistClear();
        fallbackToLogin();
        return Promise.reject(refreshError);
      }
    }
  );
}

applyAuthInterceptors(apiClient);
applyAuthInterceptors(coreApiClient);

export function setupAxiosInterceptors(store: AppStore) {
  authStore = store;
}
