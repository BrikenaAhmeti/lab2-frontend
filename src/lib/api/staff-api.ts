import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { coreApiClient } from './axios';

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

type PreviewRequestConfig = AxiosRequestConfig & {
  skipLoginRedirect?: boolean;
};

const staffStatusParamMap: Record<string, string> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  on_leave: 'ON_LEAVE',
  terminated: 'TERMINATED',
};

function normalizeStaffListParams(params: StaffListParams & { staffId?: string }) {
  if (!params.status) return params;

  const normalizedStatus = staffStatusParamMap[params.status.toLowerCase()] ?? params.status;
  return {
    ...params,
    status: normalizedStatus,
  };
}

export interface StaffDepartment {
  id: string;
  name?: string;
  departmentId?: string;
  isPrimary?: boolean;
  unassignedAt?: string | null;
  department?: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export interface StaffPositionType {
  id: string;
  name: string;
  defaultRoleKey?: string;
  defaultRoleName?: string;
  isActive?: boolean;
}

export interface StaffUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string | null;
  roles?: string[];
  role?: string | null;
}

export interface StaffRecord {
  id: string;
  roles?: string[];
  role?: string | null;
  userId?: string;
  user?: StaffUser;
  employeeCode?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  specialization?: string | null;
  licenseNumber?: string | null;
  bio?: string | null;
  isPublicProfile?: boolean;
  status?: string;
  employmentStatus?: string;
  positionType?: StaffPositionType;
  departments?: StaffDepartment[];
  futureAppointmentsCount?: number;
  isActive?: boolean;
}

export interface StaffListParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  positionTypeId?: string;
  status?: string;
}

export interface StaffListResponse {
  items: StaffRecord[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StaffPayload {
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  personalNumber?: string | null;
  staffPositionTypeId: string;
  employeeCode: string;
  specialization?: string | null;
  licenseNumber?: string | null;
  employmentStatus?: string;
  hireDate?: string | null;
  bio?: string | null;
  isPublicProfile?: boolean;
  departmentIds?: string[];
  departments?: Array<{
    departmentId: string;
    isPrimary?: boolean;
  }>;
}

export interface StaffSchedule {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
  departmentId?: string | null;
  slotDurationMinutes?: number | null;
}

interface StaffScheduleApiDay {
  dayOfWeek: number;
  isActive: boolean;
  departmentId: string | null;
  startTime: string | null;
  endTime: string | null;
  slotDurationMinutes: number | null;
  breakStart: string | null;
  breakEnd: string | null;
}

interface StaffScheduleApiResponse {
  staffProfileId: string;
  days: StaffScheduleApiDay[];
}

function fromApiSchedule(day: StaffScheduleApiDay): StaffSchedule {
  return {
    dayOfWeek: day.dayOfWeek,
    isWorking: day.isActive,
    startTime: day.startTime ?? '09:00',
    endTime: day.endTime ?? '17:00',
    breakStartTime: day.isActive ? (day.breakStart ?? '12:00') : day.breakStart,
    breakEndTime: day.isActive ? (day.breakEnd ?? '13:00') : day.breakEnd,
    departmentId: day.departmentId,
    slotDurationMinutes: day.slotDurationMinutes,
  };
}

export interface ScheduleException {
  id: string;
  date: string;
  reason?: string | null;
  isWorking: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export interface ScheduleExceptionPayload {
  date: string;
  reason?: string | null;
  isWorking: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

export const staffApi = {
  list(params: StaffListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<StaffListResponse>('/api/staff', { params: normalizeStaffListParams(params) })
      .then((response) => response.data);
  },
  publicList(params: StaffListParams & { staffId?: string }, instance?: AxiosInstance) {
    return client(instance)
      .get<StaffListResponse>('/api/public/staff', { params: normalizeStaffListParams(params) })
      .then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<StaffRecord>(`/api/staff/${id}`).then((response) => response.data);
  },
  preview(id: string, instance?: AxiosInstance) {
    const config: PreviewRequestConfig = { skipLoginRedirect: true };

    return client(instance)
      .get<StaffRecord>(`/api/staff/${id}`, config)
      .then((response) => response.data);
  },
  create(payload: StaffPayload, instance?: AxiosInstance) {
    return client(instance).post<StaffRecord>('/api/staff', payload).then((response) => response.data);
  },
  deactivate(id: string, instance?: AxiosInstance) {
    return client(instance).delete<StaffRecord>(`/api/staff/${id}`).then((response) => response.data);
  },
  addDepartment(staffId: string, departmentId: string, instance?: AxiosInstance) {
    return client(instance)
      .post<StaffRecord>(`/api/staff/${staffId}/departments`, { departmentId })
      .then((response) => response.data);
  },
  removeDepartment(staffId: string, departmentId: string, instance?: AxiosInstance) {
    return client(instance)
      .delete<StaffRecord>(`/api/staff/${staffId}/departments`, { data: { departmentId } })
      .then((response) => response.data);
  },
  schedules(staffId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<StaffScheduleApiResponse>(`/api/staff/${staffId}/schedules`)
      .then((response) => response.data.days.map(fromApiSchedule));
  },
  saveSchedules(staffId: string, schedules: StaffSchedule[], departmentId: string, instance?: AxiosInstance) {
    const days: StaffScheduleApiDay[] = schedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      isActive: schedule.isWorking,
      departmentId: schedule.isWorking ? (schedule.departmentId ?? departmentId) : null,
      startTime: schedule.isWorking ? schedule.startTime : null,
      endTime: schedule.isWorking ? schedule.endTime : null,
      slotDurationMinutes: schedule.isWorking ? (schedule.slotDurationMinutes ?? 30) : null,
      breakStart: schedule.isWorking ? (schedule.breakStartTime ?? null) : null,
      breakEnd: schedule.isWorking ? (schedule.breakEndTime ?? null) : null,
    }));

    return client(instance)
      .put<StaffScheduleApiResponse>(`/api/staff/${staffId}/schedules`, { days })
      .then((response) => response.data.days.map(fromApiSchedule));
  },
  exceptions(staffId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<ScheduleException[]>(`/api/staff/${staffId}/schedule-exceptions`)
      .then((response) => response.data);
  },
  createException(staffId: string, payload: ScheduleExceptionPayload, instance?: AxiosInstance) {
    return client(instance)
      .post<ScheduleException>(`/api/staff/${staffId}/schedule-exceptions`, payload)
      .then((response) => response.data);
  },
  deleteException(staffId: string, exceptionId: string, instance?: AxiosInstance) {
    return client(instance)
      .delete<void>(`/api/staff/${staffId}/schedule-exceptions/${exceptionId}`)
      .then((response) => response.data);
  },
};
