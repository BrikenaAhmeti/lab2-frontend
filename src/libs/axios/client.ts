import axios, { AxiosHeaders } from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/domain/auth/authSlice';
import { env } from '@/config/env';
import { addSubscriber, flushSubscribers, getRefreshing, setRefreshing } from './refreshQueue';
import type { AuthUser } from '@/domain/auth/types';

type ApiKey = 'auth' | 'core' | 'deviceInfo';
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface RefreshResponse {
  accessToken?: string;
  tokens?: {
    accessToken?: string;
  };
  user: AuthUser;
}

const base: Record<ApiKey, string> = {
  auth: env.AUTH_API_URL,
  core: env.CORE_API_URL,
  deviceInfo: env.API_DEVICE_INFO,
};

function setAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  const headers =
    config.headers instanceof AxiosHeaders ? config.headers : AxiosHeaders.from(config.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);
  config.headers = headers;
}

function build(key: ApiKey): AxiosInstance {
  const instance = axios.create({ baseURL: base[key], timeout: 20000, withCredentials: true });

  instance.interceptors.request.use(cfg => {
    const token = store.getState().auth.tokens?.accessToken;
    if (token) setAuthHeader(cfg, token);
    return cfg;
  });

  instance.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const orig = error.config as RetryableConfig | undefined;
      const status = error.response?.status;

      if (!orig) {
        return Promise.reject(error);
      }

      if (status === 401 && !orig._retry) {
        orig._retry = true;

        if (!getRefreshing()) {
          setRefreshing(true);
          try {
            const { data } = await axios.post<RefreshResponse>(`${base.auth}/auth/refresh`, {}, { withCredentials: true });
            const accessToken = data.accessToken ?? data.tokens?.accessToken;
            if (!accessToken) {
              throw new Error('Refresh response did not include an access token');
            }
            store.dispatch(setSession({ user: data.user, accessToken }));
            setRefreshing(false);
            flushSubscribers(accessToken);
            setAuthHeader(orig, accessToken);
            return instance(orig);
          } catch (e) {
            setRefreshing(false);
            store.dispatch(clearSession());
            return Promise.reject(e);
          }
        }

        return new Promise((resolve, reject) => {
          addSubscriber((newToken) => {
            setAuthHeader(orig, newToken);
            instance(orig).then(resolve).catch(reject);
          });
        });
      }

      if (status === 403) {
        store.dispatch(clearSession());
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

export const api = {
  auth: build('auth'),
  core: build('core'),
  deviceInfo: build('deviceInfo')
};
