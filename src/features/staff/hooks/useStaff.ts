import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi } from '@/lib/api/departments-api';
import { staffPositionTypesApi } from '@/lib/api/staff-position-types-api';
import { staffApi, type ScheduleExceptionPayload, type StaffListParams, type StaffSchedule } from '@/lib/api/staff-api';

export const staffQueryKey = {
  all: ['staff'] as const,
  list: (params: StaffListParams) => [...staffQueryKey.all, 'list', params] as const,
  publicList: (params: StaffListParams & { staffId?: string }) =>
    [...staffQueryKey.all, 'public', params] as const,
  detail: (id: string) => [...staffQueryKey.all, 'detail', id] as const,
  schedules: (id: string) => [...staffQueryKey.detail(id), 'schedules'] as const,
  exceptions: (id: string) => [...staffQueryKey.detail(id), 'exceptions'] as const,
  departments: ['staff', 'departments'] as const,
  positionTypes: ['staff', 'position-types'] as const,
};

export function useStaffList(params: StaffListParams) {
  return useQuery({
    queryKey: staffQueryKey.list(params),
    queryFn: () => staffApi.list(params),
  });
}

export function usePublicStaffList(params: StaffListParams & { staffId?: string }) {
  return useQuery({
    queryKey: staffQueryKey.publicList(params),
    queryFn: () => staffApi.publicList(params),
  });
}

export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: staffQueryKey.detail(id),
    queryFn: () => staffApi.get(id),
    enabled: Boolean(id),
  });
}

export function useStaffDepartments() {
  return useQuery({
    queryKey: staffQueryKey.departments,
    queryFn: async () => {
      const response = await departmentsApi.list({ page: 1, limit: 100, isActive: true });
      return response.items;
    },
  });
}

export function useStaffPositionTypeOptions() {
  return useQuery({
    queryKey: staffQueryKey.positionTypes,
    queryFn: async () => {
      const response = await staffPositionTypesApi.list({ isActive: true });
      return response.items;
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.all });
    },
  });
}

export function useAssignStaffDepartment(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) => staffApi.addDepartment(staffId, departmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.detail(staffId) });
    },
  });
}

export function useRemoveStaffDepartment(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (departmentId: string) => staffApi.removeDepartment(staffId, departmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.detail(staffId) });
    },
  });
}

export function useStaffSchedules(staffId: string) {
  return useQuery({
    queryKey: staffQueryKey.schedules(staffId),
    queryFn: () => staffApi.schedules(staffId),
    enabled: Boolean(staffId),
  });
}

export function useSaveStaffSchedules(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (schedules: StaffSchedule[]) => staffApi.saveSchedules(staffId, schedules),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.schedules(staffId) });
    },
  });
}

export function useStaffExceptions(staffId: string) {
  return useQuery({
    queryKey: staffQueryKey.exceptions(staffId),
    queryFn: () => staffApi.exceptions(staffId),
    enabled: Boolean(staffId),
  });
}

export function useCreateStaffException(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ScheduleExceptionPayload) => staffApi.createException(staffId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.exceptions(staffId) });
    },
  });
}

export function useDeleteStaffException(staffId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exceptionId: string) => staffApi.deleteException(staffId, exceptionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.exceptions(staffId) });
    },
  });
}

export function getStaffName(staff: {
  user?: { name?: string; firstName?: string; lastName?: string };
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeCode?: string;
}) {
  const userName = staff.user?.name ?? [staff.user?.firstName, staff.user?.lastName].filter(Boolean).join(' ');
  const profileName = [staff.firstName, staff.lastName].filter(Boolean).join(' ');
  return userName || profileName || staff.email || staff.employeeCode || 'Staff member';
}

export function getStaffEmail(staff: { user?: { email?: string }; email?: string }) {
  return staff.user?.email ?? staff.email ?? '-';
}

export function getStaffStatus(staff: { employmentStatus?: string; status?: string; isActive?: boolean }) {
  if (staff.employmentStatus) return staff.employmentStatus;
  if (staff.status) return staff.status;
  return staff.isActive === false ? 'inactive' : 'active';
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }

  return fallback;
}
