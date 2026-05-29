import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export const reportTypes = [
  'appointments',
  'clinical',
  'financial',
  'inventory',
  'patients',
  'staff-workload',
] as const;

export const reportExportFormats = ['csv', 'xlsx', 'pdf'] as const;

export type ReportType = (typeof reportTypes)[number];
export type ReportExportFormat = (typeof reportExportFormats)[number];
export type ReportRowValue = string | number | boolean | null;
export type ReportRow = Record<string, ReportRowValue>;

export interface ReportFilters {
  from?: string;
  to?: string;
  groupBy?: string;
  departmentId?: string;
  staffProfileId?: string;
  serviceCatalogId?: string;
  status?: string;
}

export interface ReportSummaryMetric {
  label: string;
  value: string | number;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  groupBy: string;
  filters: Record<string, string | null>;
  summary: ReportSummaryMetric[];
  rows: ReportRow[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  reportType: ReportType;
  parameters: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplatePayload {
  name: string;
  description?: string | null;
  reportType: ReportType;
  parameters: Record<string, unknown>;
}

export interface ReportTemplatesResponse {
  items: ReportTemplate[];
}

export interface ReportExportFile {
  blob: Blob;
  filename: string;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

function cleanParams(filters: ReportFilters, exportFormat?: ReportExportFormat) {
  return Object.fromEntries(
    Object.entries({
      ...filters,
      export: exportFormat,
    }).filter(([, value]) => value !== undefined && value !== '')
  );
}

function filenameFromDisposition(disposition: unknown, fallback: string) {
  if (typeof disposition !== 'string') return fallback;

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded.replace(/"/g, ''));

  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plain ?? fallback;
}

export const reportsApi = {
  generateReport(type: ReportType, filters: ReportFilters, instance?: AxiosInstance) {
    return client(instance)
      .get<ReportResult>(`/api/reports/${type}`, { params: cleanParams(filters) })
      .then((response) => response.data);
  },
  async exportReport(
    type: ReportType,
    filters: ReportFilters,
    format: ReportExportFormat,
    instance?: AxiosInstance
  ): Promise<ReportExportFile> {
    const response = await client(instance).get<Blob>(`/api/reports/${type}`, {
      params: cleanParams(filters, format),
      responseType: 'blob',
    });
    const fallback = `${type}-report.${format}`;

    return {
      blob: response.data,
      filename: filenameFromDisposition(response.headers['content-disposition'], fallback),
    };
  },
  listTemplates(reportType?: ReportType, instance?: AxiosInstance) {
    return client(instance)
      .get<ReportTemplatesResponse>('/api/reports/templates', {
        params: reportType ? { reportType } : undefined,
      })
      .then((response) => response.data);
  },
  saveTemplate(payload: ReportTemplatePayload, instance?: AxiosInstance) {
    return client(instance)
      .post<ReportTemplate>('/api/reports/templates', payload)
      .then((response) => response.data);
  },
};
