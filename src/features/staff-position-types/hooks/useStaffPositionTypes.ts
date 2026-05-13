import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi, type DepartmentRecord } from '@/lib/api/departments-api';
import {
  staffPositionTypesApi,
  type StaffPositionTypeListParams,
  type StaffPositionTypePayload,
  type StaffPositionTypeRecord,
} from '@/lib/api/staff-position-types-api';

export const staffPositionTypesQueryKey = {
  all: ['staff-position-types'] as const,
  list: (params: StaffPositionTypeListParams) => [...staffPositionTypesQueryKey.all, 'list', params] as const,
  departments: ['staff-position-types', 'departments'] as const,
};

export function useStaffPositionTypesList(params: StaffPositionTypeListParams) {
  return useQuery({
    queryKey: staffPositionTypesQueryKey.list(params),
    queryFn: () => staffPositionTypesApi.list(params),
    retry: false,
  });
}

export function useStaffPositionTypeDepartments() {
  return useQuery({
    queryKey: staffPositionTypesQueryKey.departments,
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

export function useCreateStaffPositionType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StaffPositionTypePayload) => staffPositionTypesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffPositionTypesQueryKey.all });
    },
    retry: false,
  });
}

export function useUpdateStaffPositionType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffPositionTypePayload }) =>
      staffPositionTypesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffPositionTypesQueryKey.all });
    },
    retry: false,
  });
}

export function useDeleteStaffPositionType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffPositionTypesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffPositionTypesQueryKey.all });
    },
    retry: false,
  });
}

export function toStaffPositionTypePayload(values: {
  name: string;
  description?: string;
  defaultRoleKey: string;
  applicableDepartmentIds?: string[];
  isActive?: boolean;
}): StaffPositionTypePayload {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ? values.description.trim() : null,
    defaultRoleKey: values.defaultRoleKey.trim(),
    applicableDepartmentIds: values.applicableDepartmentIds?.length ? values.applicableDepartmentIds : null,
    isActive: values.isActive ?? true,
  };
}

export function toStaffPositionTypeFormValues(record: StaffPositionTypeRecord) {
  return {
    name: record.name,
    description: record.description ?? '',
    defaultRoleKey: record.defaultRoleKey,
    applicableDepartmentIds: record.applicableDepartmentIds ?? [],
    isActive: record.isActive,
  };
}

export function getStaffPositionTypeDepartments(
  record: Pick<StaffPositionTypeRecord, 'applicableDepartments' | 'applicableDepartmentIds'>,
  departments: DepartmentRecord[]
) {
  if (record.applicableDepartments.length > 0) {
    return record.applicableDepartments.map((department) => department.name);
  }

  if (record.applicableDepartmentIds?.length) {
    return record.applicableDepartmentIds
      .map((departmentId) => departments.find((department) => department.id === departmentId)?.name)
      .filter((name): name is string => Boolean(name));
  }

  return [];
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
      return 'This staff position type cannot be deleted because staff profiles are still assigned to it.';
    }

    if (error.response?.status === 404) {
      return 'Staff position type could not be found';
    }

    if (error.response?.status === 400) {
      return 'Please review the staff position type details and try again';
    }
  }

  return fallback;
}
