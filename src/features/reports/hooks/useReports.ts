import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi } from '@/lib/api/departments-api';
import { reportsApi, type ReportExportFormat, type ReportFilters, type ReportTemplatePayload, type ReportType } from '@/lib/api/reports-api';
import { servicesApi } from '@/lib/api/services-api';
import { staffApi } from '@/lib/api/staff-api';

export const reportsQueryKey = {
  all: ['reports'] as const,
  templates: (reportType: ReportType) => [...reportsQueryKey.all, 'templates', reportType] as const,
  departments: ['reports', 'departments'] as const,
  staff: (departmentId: string) => ['reports', 'staff', departmentId] as const,
  services: (departmentId: string) => ['reports', 'services', departmentId] as const,
  snapshot: (name: string, type: ReportType, filters: ReportFilters) =>
    [...reportsQueryKey.all, 'snapshot', name, type, filters] as const,
};

export function useGenerateReport() {
  return useMutation({
    mutationFn: ({ type, filters }: { type: ReportType; filters: ReportFilters }) =>
      reportsApi.generateReport(type, filters),
    retry: false,
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({ type, filters, format }: { type: ReportType; filters: ReportFilters; format: ReportExportFormat }) =>
      reportsApi.exportReport(type, filters, format),
    retry: false,
  });
}

export function useReportTemplates(reportType: ReportType) {
  return useQuery({
    queryKey: reportsQueryKey.templates(reportType),
    queryFn: () => reportsApi.listTemplates(reportType),
    retry: false,
  });
}

export function useSaveReportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReportTemplatePayload) => reportsApi.saveTemplate(payload),
    onSuccess: async (template) => {
      await queryClient.invalidateQueries({ queryKey: reportsQueryKey.templates(template.reportType) });
    },
    retry: false,
  });
}

export function useReportDepartments() {
  return useQuery({
    queryKey: reportsQueryKey.departments,
    queryFn: async () => {
      const response = await departmentsApi.list({ page: 1, limit: 100, isActive: true });
      return response.items;
    },
    retry: false,
  });
}

export function useReportStaff(departmentId: string) {
  return useQuery({
    queryKey: reportsQueryKey.staff(departmentId),
    queryFn: async () => {
      const response = await staffApi.list({
        page: 1,
        limit: 100,
        departmentId: departmentId || undefined,
      });
      return response.items;
    },
    retry: false,
  });
}

export function useReportServices(departmentId: string) {
  return useQuery({
    queryKey: reportsQueryKey.services(departmentId),
    queryFn: async () => {
      const response = await servicesApi.list({
        page: 1,
        limit: 100,
        isActive: true,
        departmentId: departmentId || undefined,
      });
      return response.items;
    },
    retry: false,
  });
}

export function getReportApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 400) return 'Please review the report filters and try again';
    if (error.response?.status === 403) return 'You do not have access to generate reports';
    if (error.response?.status === 404) return 'Report endpoint could not be found';
  }

  return fallback;
}
