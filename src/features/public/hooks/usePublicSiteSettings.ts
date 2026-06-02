import { useQuery } from '@tanstack/react-query';
import { normalizeSettings } from '@/features/settings/hooks/useSettings';
import { normalizeWorkingHours, visibleWorkingHours, type WorkingHoursRow } from '@/features/settings/workingHours';
import { settingsApi, type SettingRecord, type SettingsResponse, type SettingValue } from '@/lib/api/settings-api';

export interface PublicSiteSettings {
  facilityName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  addressLines: string[];
  workingHours: WorkingHoursRow[];
}

export const defaultPublicSiteSettings: PublicSiteSettings = {
  facilityName: 'MedSphere',
  tagline: 'Health. Connected.',
  description:
    'Departments, service catalogs, staff workflows, patient portals, records, diagnostics, billing, and AI support in one connected system.',
  phone: '',
  email: '',
  addressLines: [],
  workingHours: [],
};

const publicSiteSettingsQueryKey = ['public', 'settings', 'site'] as const;

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function flattenSettings(response: SettingsResponse) {
  return normalizeSettings(response).flatMap((group) => group.settings);
}

function valueText(value: SettingValue) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function findSetting(settings: SettingRecord[], keys: string[]) {
  const wanted = new Set(keys.map(normalizeKey));
  return settings.find((setting) => {
    const key = normalizeKey(setting.key);
    const label = normalizeKey(setting.label ?? '');
    return wanted.has(key) || wanted.has(label);
  });
}

function findText(settings: SettingRecord[], keys: string[], fallback = '') {
  const setting = findSetting(settings, keys);
  return valueText(setting?.value ?? null) || fallback;
}

function addressFromValue(value: SettingValue) {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const line1 = valueText((record.line1 ?? record.street ?? record.address) as SettingValue);
    const line2 = valueText((record.line2 ?? record.unit ?? record.floor) as SettingValue);
    const locality = [record.city, record.region ?? record.state, record.postalCode ?? record.zip]
      .map((item) => valueText(item as SettingValue))
      .filter(Boolean)
      .join(', ');
    const country = valueText(record.country as SettingValue);

    return [line1, line2, locality, country].filter(Boolean);
  }

  return [];
}

function findAddress(settings: SettingRecord[]) {
  const setting = findSetting(settings, [
    'facility_address',
    'contact_address',
    'public_address',
    'address',
    'street_address',
  ]);
  const directLines = addressFromValue(setting?.value ?? null);
  if (directLines.length > 0) return directLines;

  const city = findText(settings, ['facility_city', 'city']);
  const region = findText(settings, ['facility_region', 'region', 'state']);
  const country = findText(settings, ['facility_country', 'country']);
  return [city, region, country].filter(Boolean);
}

function findWorkingHours(settings: SettingRecord[]) {
  const setting = findSetting(settings, [
    'working_hours',
    'business_hours',
    'operating_hours',
    'opening_hours',
    'clinic_hours',
    'facility_hours',
  ]);

  return setting ? normalizeWorkingHours(setting.value) : [];
}

export function derivePublicSiteSettings(response: SettingsResponse): PublicSiteSettings {
  const settings = flattenSettings(response);
  const workingHours = findWorkingHours(settings);

  return {
    facilityName: findText(settings, ['facility_name', 'site_name', 'organization_name', 'clinic_name', 'hospital_name'], defaultPublicSiteSettings.facilityName),
    tagline: findText(settings, ['facility_tagline', 'site_tagline', 'public_tagline', 'tagline', 'slogan'], defaultPublicSiteSettings.tagline),
    description: findText(
      settings,
      ['facility_description', 'site_description', 'public_description', 'about_summary'],
      defaultPublicSiteSettings.description
    ),
    phone: findText(settings, ['facility_phone', 'contact_phone', 'public_phone', 'support_phone', 'phone']),
    email: findText(settings, ['facility_email', 'contact_email', 'public_email', 'support_email', 'email']),
    addressLines: findAddress(settings),
    workingHours: visibleWorkingHours(workingHours).length > 0 ? workingHours : [],
  };
}

export function usePublicSiteSettings() {
  return useQuery({
    queryKey: publicSiteSettingsQueryKey,
    queryFn: () => settingsApi.publicList(),
    select: derivePublicSiteSettings,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
