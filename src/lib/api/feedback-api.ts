import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';
import type { AppointmentStatus } from './appointments-api';

export type FeedbackStatus = 'pending' | 'published' | 'hidden';

export interface FeedbackPatientSummary {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  name: string;
}

export interface FeedbackAppointmentSummary {
  id: string;
  patientId: string;
  departmentId: string;
  staffProfileId: string | null;
  status: AppointmentStatus;
  scheduledAt: string;
  endAt: string;
  completedAt: string | null;
  service: {
    id: string;
    name: string;
  };
  staff: {
    id: string;
    userId: string;
    employeeCode: string;
    specialization: string | null;
    displayName: string;
  } | null;
  department: {
    id: string;
    name: string;
  };
}

export interface FeedbackView {
  id: string;
  patientId: string;
  appointmentId: string | null;
  rating: number;
  comment: string | null;
  status: FeedbackStatus;
  isAnonymous: boolean;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  patient: FeedbackPatientSummary;
  appointment: FeedbackAppointmentSummary | null;
}

export interface FeedbackListParams {
  page?: number;
  limit?: number;
  patientSearch?: string;
  appointmentSearch?: string;
  staffProfileId?: string;
  departmentId?: string;
  status?: FeedbackStatus;
  submittedAtFrom?: string;
  submittedAtTo?: string;
}

export interface FeedbackListResponse {
  items: FeedbackView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmitFeedbackPayload {
  appointmentId: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}

export interface UpdateFeedbackStatusPayload {
  status: Exclude<FeedbackStatus, 'pending'>;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export function buildSubmitFeedbackPayload(input: {
  appointmentId: string;
  rating: number;
  comment?: string;
  isAnonymous?: boolean;
}): SubmitFeedbackPayload {
  const comment = input.comment?.trim();

  return {
    appointmentId: input.appointmentId,
    rating: input.rating,
    ...(comment ? { comment } : {}),
    ...(input.isAnonymous ? { isAnonymous: true } : {}),
  };
}

export const feedbackApi = {
  submit(payload: SubmitFeedbackPayload, instance?: AxiosInstance) {
    return client(instance).post<FeedbackView>('/api/feedback', payload).then((response) => response.data);
  },
  my(params: Pick<FeedbackListParams, 'page' | 'limit'>, instance?: AxiosInstance) {
    return client(instance).get<FeedbackListResponse>('/api/feedback/my', { params }).then((response) => response.data);
  },
  list(params: FeedbackListParams, instance?: AxiosInstance) {
    return client(instance).get<FeedbackListResponse>('/api/feedback', { params }).then((response) => response.data);
  },
  updateStatus(id: string, payload: UpdateFeedbackStatusPayload, instance?: AxiosInstance) {
    return client(instance).patch<FeedbackView>(`/api/feedback/${id}/status`, payload).then((response) => response.data);
  },
};
