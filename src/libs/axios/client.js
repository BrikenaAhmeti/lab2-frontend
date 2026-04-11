import axios from 'axios';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/domain/auth/authSlice';
import { env } from '@/config/env';
import { addSubscriber, flushSubscribers, getRefreshing, setRefreshing } from './refreshQueue';
const base = { core: env.API_CORE, deviceInfo: env.API_DEVICE_INFO };
function build(key) {
    const instance = axios.create({ baseURL: base[key], timeout: 20000 });
    instance.interceptors.request.use(cfg => {
        const token = store.getState().auth.tokens?.accessToken;
        if (token)
            cfg.headers.Authorization = `Bearer ${token}`;
        return cfg;
    });
    instance.interceptors.response.use(res => res, async (error) => {
        const orig = error.config;
        const status = error.response?.status;
        if (status === 401 && !orig._retry) {
            orig._retry = true;
            if (!getRefreshing()) {
                setRefreshing(true);
                try {
                    const refreshToken = store.getState().auth.tokens?.refreshToken;
                    if (!refreshToken)
                        throw new Error('No refresh token');
                    const { data } = await axios.post(`${base.core}/auth/refresh`, { refreshToken });
                    store.dispatch(setSession({ user: data.user, tokens: data.tokens }));
                    setRefreshing(false);
                    flushSubscribers(data.tokens.accessToken);
                    orig.headers = orig.headers ?? {};
                    orig.headers.Authorization = `Bearer ${data.tokens.accessToken}`;
                    return instance(orig);
                }
                catch (e) {
                    setRefreshing(false);
                    store.dispatch(clearSession());
                    return Promise.reject(e);
                }
            }
            return new Promise((resolve, reject) => {
                addSubscriber((newToken) => {
                    orig.headers = orig.headers ?? {};
                    orig.headers.Authorization = `Bearer ${newToken}`;
                    instance(orig).then(resolve).catch(reject);
                });
            });
        }
        if (status === 403) {
            store.dispatch(clearSession());
        }
        return Promise.reject(error);
    });
    return instance;
}
export const api = {
    core: build('core'),
    deviceInfo: build('deviceInfo')
};
