import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export type SettingValue = string | number | boolean | Record<string, unknown> | unknown[] | null;

export interface SettingRecord {
  key: string;
  value: SettingValue;
  category: string;
  label?: string;
  description?: string | null;
  type?: string;
  updatedAt?: string;
}

export interface SettingsGroup {
  category: string;
  settings: SettingRecord[];
}

export type SettingsResponse = Record<string, SettingRecord[]> | SettingRecord[] | { items: SettingRecord[] };

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const settingsApi = {
  list(instance?: AxiosInstance) {
    return client(instance).get<SettingsResponse>('/api/settings').then((response) => response.data);
  },
  update(key: string, value: SettingValue, instance?: AxiosInstance) {
    return client(instance).put<SettingRecord>(`/api/settings/${key}`, { value }).then((response) => response.data);
  },
  updateBulk(settings: Record<string, SettingValue>, instance?: AxiosInstance) {
    return client(instance).put<SettingsResponse>('/api/settings/bulk', { settings }).then((response) => response.data);
  },
};
