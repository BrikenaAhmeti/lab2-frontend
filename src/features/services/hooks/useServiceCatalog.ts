import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi, type DepartmentRecord } from '@/lib/api/departments-api';
import { servicesApi, type ServiceListParams, type ServicePayload, type ServiceRecord } from '@/lib/api/services-api';

export const serviceCatalogQueryKey = {
  all: ['service-catalog'] as const,
  list: (params: ServiceListParams) => [...serviceCatalogQueryKey.all, 'list', params] as const,
  departments: ['service-catalog', 'departments'] as const,
};

export function useServiceCatalogList(params: ServiceListParams) {
  return useQuery({
    queryKey: serviceCatalogQueryKey.list(params),
    queryFn: () => servicesApi.list(params),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useDepartmentsOptions() {
  return useQuery({
    queryKey: serviceCatalogQueryKey.departments,
    queryFn: async () => {
      const response = await departmentsApi.list({
        page: 1,
        limit: 100,
        isActive: true,
      });

      return response.items;
    },
    retry: false,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ServicePayload) => servicesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceCatalogQueryKey.all });
    },
    retry: false,
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServicePayload }) => servicesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceCatalogQueryKey.all });
    },
    retry: false,
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serviceCatalogQueryKey.all });
    },
    retry: false,
  });
}

export function toServicePayload(values: {
  departmentId: string;
  name: string;
  description?: string;
  defaultDurationMinutes: number;
  defaultPrice: number;
  isActive?: boolean;
  sortOrder?: number;
}): ServicePayload {
  return {
    departmentId: values.departmentId,
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    defaultDurationMinutes: values.defaultDurationMinutes,
    defaultPrice: values.defaultPrice,
    isActive: values.isActive ?? true,
    sortOrder: values.sortOrder ?? 0,
  };
}

export function toServiceFormValues(service: ServiceRecord) {
  return {
    departmentId: service.departmentId,
    name: service.name,
    description: service.description ?? '',
    defaultDurationMinutes: service.defaultDurationMinutes,
    defaultPrice: Number(service.defaultPrice),
    isActive: service.isActive,
    sortOrder: service.sortOrder,
  };
}

export function getDepartmentName(
  service: Pick<ServiceRecord, 'departmentId' | 'department'>,
  departments: DepartmentRecord[]
) {
  if (service.department?.name) {
    return service.department.name;
  }

  return departments.find((department) => department.id === service.departmentId)?.name ?? '-';
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      const firstMessage = message.find((item) => typeof item === 'string');
      if (firstMessage) {
        return firstMessage;
      }
    }

    if (error.response?.status === 409) {
      return 'Service cannot be deactivated while active appointments reference it';
    }

    if (error.response?.status === 404) {
      return 'Service could not be found';
    }

    if (error.response?.status === 400) {
      return 'Please review the service details and try again';
    }
  }

  return fallback;
}
