import type { ExchangeFormat, ImportMode } from '@/lib/api/data-exchange-api';

export const formatLabels: Record<ExchangeFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  json: 'JSON',
};

export const modeLabels: Record<ImportMode, string> = {
  strict: 'Strict',
  lenient: 'Lenient',
};
