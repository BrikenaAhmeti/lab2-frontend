import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AppStore } from '@/app/store';
import { authApi } from './auth-api';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { env } from '@/config/env';

const baseURL = env.AUTH_API_URL;
const coreBaseURL = env.CORE_API_URL;
const cmsBaseURL = env.CMS_API_URL;
const aiBaseURL = env.AI_API_URL;
const LEGACY_AUTH_STORAGE_KEY = 'medsphere.auth';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type RefreshSubscriber = (token: string) => void;

let isRefreshing = false;
let subscribers: RefreshSubscriber[] = [];
let authStore: AppStore | null = null;

export const apiClient = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
});

export const coreApiClient = axios.create({
  baseURL: coreBaseURL,
  timeout: 20000,
  withCredentials: true,
});

export const publicCoreApiClient = axios.create({
  baseURL: coreBaseURL,
  timeout: 20000,
  withCredentials: false,
});

export const notificationApiClient = axios.create({
  baseURL: env.NOTIFICATION_API_URL,
  timeout: 20000,
  withCredentials: true,
});

export const cmsApiClient = axios.create({
  baseURL: cmsBaseURL,
  timeout: 20000,
  withCredentials: true,
});

export const aiApiClient = axios.create({
  baseURL: aiBaseURL,
  timeout: 20000,
  withCredentials: true,
});

export const rawClient = axios.create({
  baseURL,
  timeout: 20000,
  withCredentials: true,
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

function setCmsEditorHeaders(config: InternalAxiosRequestConfig) {
  if (!authStore) {
    return config;
  }

  const user = authStore.getState().auth.user;
  if (!user) {
    return config;
  }

  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers ?? {});
  const permissions = new Set(user.permissions ?? []);

  if ([...permissions].some((permission) => permission === 'cms:edit' || permission.startsWith('cms:edit:'))) {
    permissions.add('cms:edit');
  }

  headers.set('x-user-id', user.id);
  headers.set('x-user-roles', (user.roles ?? []).join(','));
  headers.set('x-user-permissions', [...permissions].join(','));
  config.headers = headers;

  return config;
}

function fallbackToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function clearLegacyStoredAuth() {
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
}

async function refreshTokenFlow(store: AppStore) {
  const refreshed = await authApi.refresh(undefined, rawClient);
  store.dispatch(setSession(refreshed));
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
        const nextToken = await refreshTokenFlow(authStore);
        isRefreshing = false;
        notifySubscribers(nextToken);
        setAuthHeader(originalRequest, nextToken);
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        subscribers = [];
        authStore.dispatch(clearSession());
        clearLegacyStoredAuth();
        fallbackToLogin();
        return Promise.reject(refreshError);
      }
    }
  );
}

applyAuthInterceptors(apiClient);
applyAuthInterceptors(coreApiClient);
applyAuthInterceptors(notificationApiClient);
applyAuthInterceptors(cmsApiClient);
applyAuthInterceptors(aiApiClient);
cmsApiClient.interceptors.request.use(setCmsEditorHeaders);

export function setupAxiosInterceptors(store: AppStore) {
  authStore = store;
}
