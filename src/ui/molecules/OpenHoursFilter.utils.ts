export type OpenHoursFilterMode = 'single' | 'range';

export interface OpenHoursFilterValue {
  mode: OpenHoursFilterMode;
  singleDate: string;
  singleTime: string;
  rangeStartDate: string;
  rangeStartTime: string;
  rangeEndDate: string;
  rangeEndTime: string;
}

export interface OpenHoursFilterParams {
  openAt?: string;
  openFrom?: string;
  openTo?: string;
}

export const emptyOpenHoursFilterValue: OpenHoursFilterValue = {
  mode: 'single',
  singleDate: '',
  singleTime: '',
  rangeStartDate: '',
  rangeStartTime: '',
  rangeEndDate: '',
  rangeEndTime: '',
};

function combineDateTime(date: string, time: string) {
  return date && time ? `${date}T${time}` : undefined;
}

function formatDateTime(date: string, time: string) {
  if (!date || !time) return '';

  const parsed = new Date(`${date}T${time}:00.000`);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function openHoursFilterToParams(value: OpenHoursFilterValue): OpenHoursFilterParams {
  if (value.mode === 'single') {
    return {
      openAt: combineDateTime(value.singleDate, value.singleTime),
    };
  }

  return {
    openFrom: combineDateTime(value.rangeStartDate, value.rangeStartTime),
    openTo: combineDateTime(value.rangeEndDate, value.rangeEndTime),
  };
}

export function isOpenHoursFilterActive(value: OpenHoursFilterValue) {
  if (value.mode === 'single') {
    return Boolean(value.singleDate && value.singleTime);
  }

  return Boolean(value.rangeStartDate && value.rangeStartTime && value.rangeEndDate && value.rangeEndTime);
}

export function formatOpenHoursFilterSummary(value: OpenHoursFilterValue) {
  if (value.mode === 'single') {
    return formatDateTime(value.singleDate, value.singleTime);
  }

  const start = formatDateTime(value.rangeStartDate, value.rangeStartTime);
  const end = formatDateTime(value.rangeEndDate, value.rangeEndTime);

  return start && end ? `${start} - ${end}` : '';
}
