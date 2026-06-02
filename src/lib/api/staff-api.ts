import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

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
  isActive?: boolean;
}

export interface StaffUser {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string | null;
}

export interface StaffRecord {
  id: string;
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

export interface CreateStaffPayload {
  userId: string;
  staffPositionTypeId: string;
  employeeCode: string;
  specialization?: string;
  employmentStatus: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  isPublicProfile: boolean;
  departments: Array<{
    departmentId: string;
    isPrimary: boolean;
  }>;
}

export interface StaffSchedule {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
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
  create(payload: CreateStaffPayload, instance?: AxiosInstance) {
    return client(instance).post<StaffRecord>('/api/staff', payload).then((response) => response.data);
  },
  publicList(params: StaffListParams & { staffId?: string }, instance?: AxiosInstance) {
    return client(instance)
      .get<StaffListResponse>('/api/public/staff', { params: normalizeStaffListParams(params) })
      .then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<StaffRecord>(`/api/staff/${id}`).then((response) => response.data);
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
    return client(instance).get<StaffSchedule[]>(`/api/staff/${staffId}/schedules`).then((response) => response.data);
  },
  saveSchedules(staffId: string, schedules: StaffSchedule[], instance?: AxiosInstance) {
    return client(instance).put<StaffSchedule[]>(`/api/staff/${staffId}/schedules`, { schedules }).then((response) => response.data);
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
