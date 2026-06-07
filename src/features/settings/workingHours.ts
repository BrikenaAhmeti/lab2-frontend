import type { SettingRecord, SettingValue } from '@/lib/api/settings-api';

export interface WorkingHoursRow {
  day: string;
  label: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export const workingHourDays = [
  { day: 'monday', label: 'Monday' },
  { day: 'tuesday', label: 'Tuesday' },
  { day: 'wednesday', label: 'Wednesday' },
  { day: 'thursday', label: 'Thursday' },
  { day: 'friday', label: 'Friday' },
  { day: 'saturday', label: 'Saturday' },
  { day: 'sunday', label: 'Sunday' },
] as const;

const defaultStartTime = '09:00';
const defaultEndTime = '17:00';
const weekdayDayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const weekendDayKeys = ['saturday', 'sunday'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function booleanValue(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function normalizeDayKey(value: unknown) {
  const raw = text(value).toLowerCase();
  if (!raw) return '';

  const compact = raw.replace(/[^a-z]/g, '');
  const match = workingHourDays.find((day) => day.day === compact || day.label.toLowerCase() === compact || day.day.startsWith(compact.slice(0, 3)));

  return match?.day ?? '';
}

function dayKeysFromKey(value: unknown) {
  const raw = text(value).toLowerCase();
  if (!raw) return [];

  const compact = raw.replace(/[^a-z]/g, '');

  if (['weekday', 'weekdays', 'businessday', 'businessdays', 'mondayfriday', 'monfri'].includes(compact)) {
    return weekdayDayKeys;
  }

  if (['weekend', 'weekends', 'saturdaysunday', 'satsun'].includes(compact)) {
    return weekendDayKeys;
  }

  if (['daily', 'everyday', 'everydayhours', 'allday', 'alldays', 'week'].includes(compact)) {
    return workingHourDays.map(({ day }) => day);
  }

  const day = normalizeDayKey(value);
  return day ? [day] : [];
}

function splitTimeRange(value: unknown) {
  const raw = text(value);
  if (!raw || /closed|off|none/i.test(raw)) {
    return { isOpen: false, startTime: defaultStartTime, endTime: defaultEndTime };
  }

  const [start, end] = raw
    .replace(/\s*(to|–|—)\s*/gi, '-')
    .split('-')
    .map((item) => item.trim());

  return {
    isOpen: Boolean(start && end),
    startTime: start || defaultStartTime,
    endTime: end || defaultEndTime,
  };
}

function rowFromRecord(day: string, value: Record<string, unknown>): WorkingHoursRow {
  const openFlag =
    booleanValue(value.isOpen) ??
    booleanValue(value.open) ??
    booleanValue(value.enabled) ??
    (typeof value.isClosed === 'boolean' ? !value.isClosed : undefined) ??
    (typeof value.closed === 'boolean' ? !value.closed : undefined);
  const startTime = text(value.startTime) || text(value.start) || text(value.openTime) || text(value.from) || defaultStartTime;
  const endTime = text(value.endTime) || text(value.end) || text(value.closeTime) || text(value.to) || defaultEndTime;
  const isOpen = openFlag ?? Boolean(startTime && endTime);

  return {
    day,
    label: workingHourDays.find((item) => item.day === day)?.label ?? day,
    isOpen,
    startTime,
    endTime,
  };
}

function rowFromUnknown(day: string, value: unknown): WorkingHoursRow {
  if (isRecord(value)) {
    return rowFromRecord(day, value);
  }

  if (typeof value === 'string') {
    const parsed = splitTimeRange(value);
    return {
      day,
      label: workingHourDays.find((item) => item.day === day)?.label ?? day,
      ...parsed,
    };
  }

  return {
    day,
    label: workingHourDays.find((item) => item.day === day)?.label ?? day,
    isOpen: false,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
  };
}

function workingHoursSource(value: unknown) {
  if (!isRecord(value)) return value;

  const nested = value.workingHours ?? value.operatingHours ?? value.businessHours ?? value.openingHours ?? value.hours ?? value.days;
  return nested ?? value;
}

export function isWorkingHoursSetting(setting: Pick<SettingRecord, 'key' | 'label' | 'type'>) {
  const haystack = `${setting.key} ${setting.label ?? ''} ${setting.type ?? ''}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  return (
    haystack.includes('working hours') ||
    haystack.includes('business hours') ||
    haystack.includes('operating hours') ||
    haystack.includes('opening hours') ||
    haystack.includes('clinic hours') ||
    haystack.includes('facility hours')
  );
}

export function normalizeWorkingHours(value: unknown): WorkingHoursRow[] {
  const source = workingHoursSource(value);
  const rows = new Map<string, WorkingHoursRow>();

  if (Array.isArray(source)) {
    source.forEach((item) => {
      if (!isRecord(item)) return;
      const day = normalizeDayKey(item.day ?? item.name ?? item.label);
      if (!day) return;
      rows.set(day, rowFromRecord(day, item));
    });
  } else if (isRecord(source)) {
    Object.entries(source).forEach(([key, item]) => {
      dayKeysFromKey(key).forEach((day) => {
        rows.set(day, rowFromUnknown(day, item));
      });
    });
  }

  return workingHourDays.map(({ day, label }) => {
    const row = rows.get(day);
    return row ?? { day, label, isOpen: false, startTime: defaultStartTime, endTime: defaultEndTime };
  });
}

export function workingHoursRowsToValue(rows: WorkingHoursRow[]): Record<string, { isOpen: boolean; startTime: string | null; endTime: string | null }> {
  return Object.fromEntries(
    rows.map((row) => [
      row.day,
      {
        isOpen: row.isOpen,
        startTime: row.isOpen ? row.startTime : null,
        endTime: row.isOpen ? row.endTime : null,
      },
    ])
  );
}

export function workingHoursRowsToDraft(rows: WorkingHoursRow[]) {
  return JSON.stringify(workingHoursRowsToValue(rows), null, 2);
}

export function draftToWorkingHoursRows(draft: string, fallbackValue: SettingValue) {
  try {
    return normalizeWorkingHours(JSON.parse(draft));
  } catch {
    return normalizeWorkingHours(fallbackValue);
  }
}

export function formatWorkingHoursLine(row: WorkingHoursRow) {
  return row.isOpen ? `${row.label}: ${row.startTime} to ${row.endTime}` : `${row.label}: Closed`;
}

export function visibleWorkingHours(rows: WorkingHoursRow[]) {
  return rows.filter((row) => row.isOpen);
}
