import type { AxiosInstance } from 'axios';
import { coreApiClient, publicCoreApiClient } from './axios';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentType = 'IN_PERSON' | 'VIRTUAL' | 'WALK_IN' | 'FOLLOW_UP';

export interface AppointmentPatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  name: string;
}

export interface AppointmentStaffSummary {
  id: string;
  userId: string;
  employeeCode: string;
  specialization: string | null;
  displayName: string;
}

export interface AppointmentView {
  id: string;
  patientId: string;
  departmentId: string;
  serviceCatalogId: string;
  staffProfileId: string | null;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  scheduledAt: string;
  endAt: string;
  durationMinutes: number;
  basePrice: number;
  notes: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationNote: string | null;
  createdAt: string;
  updatedAt: string;
  patient: AppointmentPatientSummary;
  staff: AppointmentStaffSummary | null;
  service: {
    id: string;
    name: string;
    defaultDurationMinutes: number;
    defaultPrice: number;
  };
  department: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  date?: string;
  staffId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  departmentId?: string;
  from?: string;
  to?: string;
  hasNoFeedback?: boolean;
}

export interface AppointmentListResponse {
  items: AppointmentView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailableSlot {
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface AvailableSlotsResponse {
  staffProfileId: string;
  serviceId: string;
  date: string;
  slots: AvailableSlot[];
}

export interface BookAppointmentPayload {
  patientId: string;
  serviceCatalogId: string;
  staffProfileId: string;
  scheduledAt: string;
  appointmentType?: AppointmentType;
  notes?: string | null;
}

export interface PublicAppointmentPatientPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalNumber: string;
  dateOfBirth: string;
  gender: string;
}

export interface PublicBookAppointmentPayload {
  patient: PublicAppointmentPatientPayload;
  serviceCatalogId: string;
  staffProfileId: string;
  scheduledAt: string;
  appointmentType?: AppointmentType;
  notes?: string | null;
}

export interface RescheduleAppointmentPayload {
  scheduledAt: string;
  serviceCatalogId?: string;
  staffProfileId?: string;
  appointmentType?: AppointmentType;
  notes?: string | null;
}

export interface UpdateAppointmentStatusPayload {
  action: 'confirm' | 'check-in' | 'start' | 'complete' | 'cancel' | 'no-show';
  reason?: string | null;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const appointmentsApi = {
  list(params: AppointmentListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<AppointmentListResponse>('/api/appointments', { params })
      .then((response) => response.data);
  },
  today(instance?: AxiosInstance) {
    return client(instance).get<AppointmentView[]>('/api/appointments/today').then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<AppointmentView>(`/api/appointments/${id}`).then((response) => response.data);
  },
  create(payload: BookAppointmentPayload, instance?: AxiosInstance) {
    return client(instance).post<AppointmentView>('/api/appointments', payload).then((response) => response.data);
  },
  publicCreate(payload: PublicBookAppointmentPayload, instance?: AxiosInstance) {
    return (instance ?? publicCoreApiClient)
      .post<AppointmentView>('/api/public/appointments', payload)
      .then((response) => response.data);
  },
  reschedule(id: string, payload: RescheduleAppointmentPayload, instance?: AxiosInstance) {
    return client(instance).put<AppointmentView>(`/api/appointments/${id}`, payload).then((response) => response.data);
  },
  updateStatus(id: string, payload: UpdateAppointmentStatusPayload, instance?: AxiosInstance) {
    return client(instance).patch<AppointmentView>(`/api/appointments/${id}/status`, payload).then((response) => response.data);
  },
  availableSlots(staffProfileId: string, params: { date: string; serviceId: string }, instance?: AxiosInstance) {
    return client(instance)
      .get<AvailableSlotsResponse>(`/api/staff/${staffProfileId}/available-slots`, { params })
      .then((response) => response.data);
  },
  publicAvailableSlots(staffProfileId: string, params: { date: string; serviceId: string }, instance?: AxiosInstance) {
    return (instance ?? publicCoreApiClient)
      .get<AvailableSlotsResponse>(`/api/public/staff/${staffProfileId}/available-slots`, { params })
      .then((response) => response.data);
  },
};
