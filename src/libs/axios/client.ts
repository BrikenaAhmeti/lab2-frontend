import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/domain/auth/authSlice';
import { env } from '@/config/env';
import { addSubscriber, flushSubscribers, getRefreshing, setRefreshing } from './refreshQueue';

type ApiKey = 'core' | 'deviceInfo';
const base: Record<ApiKey, string> = { core: env.API_CORE, deviceInfo: env.API_DEVICE_INFO };

function build(key: ApiKey): AxiosInstance {
  const instance = axios.create({ baseURL: base[key], timeout: 20000, withCredentials: true });

  instance.interceptors.request.use(cfg => {
    const token = store.getState().auth.tokens?.accessToken;
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });

  instance.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const orig = error.config!;
      const status = error.response?.status;

      if (status === 401 && !(orig as any)._retry) {
        (orig as any)._retry = true;

        if (!getRefreshing()) {
          setRefreshing(true);
          try {
            const { data } = await axios.post(`${base.core}/auth/refresh`, {}, { withCredentials: true });
            const accessToken = data.accessToken ?? data.tokens?.accessToken;
            store.dispatch(setSession({ user: data.user, accessToken }));
            setRefreshing(false);
            flushSubscribers(accessToken);
            orig.headers = orig.headers ?? {};
            (orig.headers as any).Authorization = `Bearer ${accessToken}`;
            return instance(orig);
          } catch (e) {
            setRefreshing(false);
            store.dispatch(clearSession());
            return Promise.reject(e);
          }
        }

        return new Promise((resolve, reject) => {
          addSubscriber((newToken) => {
            orig.headers = orig.headers ?? {};
            (orig.headers as any).Authorization = `Bearer ${newToken}`;
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
  core: build('core'),
  deviceInfo: build('deviceInfo')
};
