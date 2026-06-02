import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { publicCoreApiClient } from '@/lib/api/axios';
import { departmentsApi } from '@/lib/api/departments-api';
import { servicesApi } from '@/lib/api/services-api';

export const publicCatalogQueryKeys = {
  departments: (search: string) => ['public', 'departments', search] as const,
  services: (params: { search?: string; departmentId?: string }) => ['public', 'services', params] as const,
};

export function usePublicDepartments(search = '') {
  return useQuery({
    queryKey: publicCatalogQueryKeys.departments(search),
    queryFn: () =>
      departmentsApi.list(
        {
          page: 1,
          limit: 100,
          search: search || undefined,
          isActive: true,
          sortBy: 'sortOrder',
          sortDirection: 'asc',
        },
        publicCoreApiClient
      ),
    retry: false,
  });
}

export function usePublicServices(params: { search?: string; departmentId?: string }) {
  return useQuery({
    queryKey: publicCatalogQueryKeys.services(params),
    queryFn: () =>
      servicesApi.list(
        {
          page: 1,
          limit: 100,
          search: params.search || undefined,
          departmentId: params.departmentId || undefined,
          isActive: true,
          sortBy: 'sortOrder',
          sortDirection: 'asc',
        },
        publicCoreApiClient
      ),
    retry: false,
  });
}

export function getPublicCatalogError(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = (error.response?.data as { message?: string } | undefined)?.message;

    if (status === 401 || status === 403) return 'This public list is not available right now.';
    if (message) return message;
  }

  return fallback;
}
