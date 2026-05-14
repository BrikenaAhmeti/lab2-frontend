import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  settingsApi,
  type SettingsGroup,
  type SettingsResponse,
  type SettingRecord,
  type SettingValue,
} from '@/lib/api/settings-api';

export const settingsQueryKey = {
  all: ['settings'] as const,
};

function fromList(items: SettingRecord[]) {
  const groups = new Map<string, SettingsGroup>();

  for (const setting of items) {
    const category = setting.category || 'General';
    const group = groups.get(category) ?? { category, settings: [] };
    group.settings.push(setting);
    groups.set(category, group);
  }

  return Array.from(groups.values());
}

export function normalizeSettings(response: SettingsResponse): SettingsGroup[] {
  if (Array.isArray(response)) {
    return fromList(response);
  }

  if ('items' in response && Array.isArray(response.items)) {
    return fromList(response.items);
  }

  return Object.entries(response).map(([category, settings]) => ({
    category,
    settings,
  }));
}

export function useSettings(enabled = true) {
  return useQuery({
    queryKey: settingsQueryKey.all,
    queryFn: () => settingsApi.list(),
    select: normalizeSettings,
    enabled,
    retry: false,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: SettingValue }) => settingsApi.update(key, value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey.all });
    },
    retry: false,
  });
}

export function parseSettingValue(rawValue: string, currentValue: SettingValue): SettingValue {
  if (typeof currentValue === 'boolean') {
    return rawValue === 'true';
  }

  if (typeof currentValue === 'number') {
    return Number(rawValue);
  }

  if (currentValue && typeof currentValue === 'object') {
    return JSON.parse(rawValue) as SettingValue;
  }

  return rawValue.trim();
}

export function formatSettingValue(value: SettingValue) {
  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value ?? '');
}

export function getSettingsErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      const firstMessage = message.find((item) => typeof item === 'string');
      if (firstMessage) return firstMessage;
    }
  }

  return fallback;
}
