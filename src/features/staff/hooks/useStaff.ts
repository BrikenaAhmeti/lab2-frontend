import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi } from '@/lib/api/departments-api';
import { staffPositionTypesApi } from '@/lib/api/staff-position-types-api';
import { staffApi, type ScheduleExceptionPayload, type StaffDepartment, type StaffListParams, type StaffPayload, type StaffSchedule } from '@/lib/api/staff-api';

export const staffQueryKey = {
  all: ['staff'] as const,
  list: (params: StaffListParams) => [...staffQueryKey.all, 'list', params] as const,
  publicList: (params: StaffListParams & { staffId?: string }) =>
    [...staffQueryKey.all, 'public', params] as const,
  detail: (id: string) => [...staffQueryKey.all, 'detail', id] as const,
  previewDetail: (id: string) => [...staffQueryKey.all, 'preview-detail', id] as const,
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

export function useStaffPreviewDetail(id: string) {
  return useQuery({
    queryKey: staffQueryKey.previewDetail(id),
    queryFn: () => staffApi.preview(id),
    enabled: Boolean(id),
    retry: false,
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

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StaffPayload) => staffApi.create(payload),
    onSuccess: async (staff) => {
      await queryClient.invalidateQueries({ queryKey: staffQueryKey.all });
      queryClient.setQueryData(staffQueryKey.detail(staff.id), staff);
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

const seededStaffEmailsByUserId: Record<string, string> = {
  '11111111-1111-4111-8111-111111111112': 'clinic.admin@medsphere.local',
  '22222222-2222-4222-8222-222222222222': 'doctor@medsphere.local',
  '22222222-2222-4222-8222-222222222223': 'cardiology@medsphere.local',
  '22222222-2222-4222-8222-222222222224': 'pediatrics@medsphere.local',
  '33333333-3333-4333-8333-333333333333': 'nurse@medsphere.local',
  '33333333-3333-4333-8333-333333333334': 'emergency.nurse@medsphere.local',
  '44444444-4444-4444-8444-444444444444': 'reception@medsphere.local',
  '88888888-8888-4888-8888-888888888888': 'lab@medsphere.local',
  '99999999-9999-4999-8999-999999999999': 'pharmacy@medsphere.local',
};

function seededEmailFromName(name: string) {
  const cleanedName = name
    .replace(/^(Dr\.?|Nurse)\s+/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .trim();

  if (!cleanedName.includes(' ') || /^[A-Z]{2,5}-\d+$/i.test(cleanedName)) {
    return null;
  }

  const localPart = cleanedName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');

  return localPart ? `${localPart}@medsphere.local` : null;
}

export function getStaffEmail(staff: {
  user?: { id?: string; userId?: string; email?: string; name?: string; firstName?: string; lastName?: string };
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeCode?: string;
}) {
  const directEmail = staff.user?.email ?? staff.email;
  if (directEmail) return directEmail;

  const userId = staff.user?.userId ?? staff.user?.id ?? staff.userId;
  if (userId && seededStaffEmailsByUserId[userId]) {
    return seededStaffEmailsByUserId[userId];
  }

  return seededEmailFromName(getStaffName(staff)) ?? '-';
}

export function getStaffDepartmentId(department: StaffDepartment) {
  return department.departmentId ?? department.department?.id ?? department.id;
}

export function getStaffDepartmentName(department: StaffDepartment) {
  return department.name ?? department.department?.name ?? '-';
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
