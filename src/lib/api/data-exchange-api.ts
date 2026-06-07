import { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { coreApiClient } from './axios';

export const exchangeFormats = ['csv', 'xlsx', 'json'] as const;
export const exportEntities = ['patients', 'appointments', 'lab-results', 'inventory-items', 'billings', 'audit-logs'] as const;
export const importEntities = ['patients', 'inventory-items', 'lab-tests', 'service-catalog', 'staff'] as const;
export const importModes = ['strict', 'lenient'] as const;

export type ExchangeFormat = (typeof exchangeFormats)[number];
export type ExportEntity = (typeof exportEntities)[number];
export type ImportEntity = (typeof importEntities)[number];
export type ImportMode = (typeof importModes)[number];

export interface FileDownload {
  blob: Blob;
  filename: string;
}

export interface ExportFileOptions {
  excludeFields?: string[];
}

export interface ImportRowError {
  row: number;
  field?: string;
  reason: string;
}

export interface ImportResult {
  entity: ImportEntity;
  mode: ImportMode;
  status: 'completed';
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportRowError[];
}

export interface ImportJob {
  id: string;
  entity: ImportEntity;
  mode: ImportMode;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: ImportResult;
  error?: string;
}

export type ImportResponse = {
  status: number;
  data: ImportResult | ImportJob;
};

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

function isAxiosInstance(value: unknown): value is AxiosInstance {
  return Boolean(value && typeof (value as AxiosInstance).get === 'function');
}

function filenameFromDisposition(disposition?: string) {
  if (!disposition) {
    return 'download';
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ''));
  }

  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ? match[1] : 'download';
}

function toFileDownload(response: AxiosResponse<Blob>): FileDownload {
  const disposition = String(response.headers['content-disposition'] ?? response.headers['Content-Disposition'] ?? '');

  return {
    blob: response.data,
    filename: filenameFromDisposition(disposition),
  };
}

export function downloadFile(file: FileDownload) {
  const url = window.URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const dataExchangeApi = {
  exportFile(
    entity: ExportEntity,
    format: ExchangeFormat,
    optionsOrInstance?: ExportFileOptions | AxiosInstance,
    instance?: AxiosInstance
  ) {
    const options = isAxiosInstance(optionsOrInstance) ? undefined : optionsOrInstance;
    const resolvedInstance = isAxiosInstance(optionsOrInstance) ? optionsOrInstance : instance;

    return client(resolvedInstance)
      .get<Blob>(`/api/export/${entity}`, {
        params: {
          format,
          excludeFields: options?.excludeFields?.length ? options.excludeFields.join(',') : undefined,
        },
        responseType: 'blob',
      })
      .then(toFileDownload);
  },
  downloadTemplate(entity: ImportEntity, format: ExchangeFormat, instance?: AxiosInstance) {
    return client(instance)
      .get<Blob>(`/api/import/template/${entity}`, { params: { format }, responseType: 'blob' })
      .then(toFileDownload);
  },
  importFile(
    entity: ImportEntity,
    payload: { file: File; mode: ImportMode; asyncImport?: boolean },
    instance?: AxiosInstance
  ): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', payload.file);

    return client(instance)
      .post<ImportResult | ImportJob>(`/api/import/${entity}`, formData, {
        params: {
          mode: payload.mode,
          async: payload.asyncImport ? 'true' : undefined,
        },
      })
      .then((response) => ({ status: response.status, data: response.data }));
  },
  getImportJob(jobId: string, instance?: AxiosInstance) {
    return client(instance).get<ImportJob>(`/api/import/jobs/${jobId}`).then((response) => response.data);
  },
};

export function getDataExchangeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 403) return 'You do not have access to this action';
    if (error.response?.status === 404) return 'The requested import job could not be found';
    if (error.response?.status === 400) return 'Please check the file and try again';
  }

  return fallback;
}
