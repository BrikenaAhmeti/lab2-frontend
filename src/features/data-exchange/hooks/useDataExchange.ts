import { useMutation, useQuery } from '@tanstack/react-query';
import {
  dataExchangeApi,
  type ExchangeFormat,
  type ExportFileOptions,
  type ExportEntity,
  type ImportEntity,
  type ImportMode,
} from '@/lib/api/data-exchange-api';

export const dataExchangeQueryKey = {
  all: ['data-exchange'] as const,
  job: (id: string) => [...dataExchangeQueryKey.all, 'import-job', id] as const,
};

export function useExportFile() {
  return useMutation({
    mutationFn: ({ entity, format, excludeFields }: { entity: ExportEntity; format: ExchangeFormat } & ExportFileOptions) => {
      const options = excludeFields?.length ? { excludeFields } : undefined;
      return options ? dataExchangeApi.exportFile(entity, format, options) : dataExchangeApi.exportFile(entity, format);
    },
    retry: false,
  });
}

export function useImportTemplate() {
  return useMutation({
    mutationFn: ({ entity, format }: { entity: ImportEntity; format: ExchangeFormat }) =>
      dataExchangeApi.downloadTemplate(entity, format),
    retry: false,
  });
}

export function useImportFile() {
  return useMutation({
    mutationFn: ({ entity, file, mode }: { entity: ImportEntity; file: File; mode: ImportMode }) =>
      dataExchangeApi.importFile(entity, { file, mode }),
    retry: false,
  });
}

export function useImportJob(jobId: string, enabled: boolean) {
  return useQuery({
    queryKey: dataExchangeQueryKey.job(jobId),
    queryFn: () => dataExchangeApi.getImportJob(jobId),
    enabled: enabled && Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'processing' ? 1500 : false;
    },
    retry: false,
  });
}
