import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export type BloodType =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE'
  | 'UNKNOWN';

export interface PatientRecord {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: BloodType | null;
  personalNumber: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  allergies: unknown;
  medicalNotes: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  gender?: string;
  bloodType?: BloodType;
  isActive?: boolean;
  dateOfBirthFrom?: string;
  dateOfBirthTo?: string;
}

export interface PatientListResponse {
  items: PatientRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientPayload {
  userId?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  bloodType?: BloodType | null;
  personalNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  allergies?: string | null;
  medicalNotes?: string | null;
}

export type PatientTimelineType =
  | 'appointment'
  | 'medical_record'
  | 'prescription'
  | 'lab_order'
  | 'billing';

export interface PatientTimelineItem {
  id: string;
  type: PatientTimelineType;
  occurredAt: string;
  title: string;
  status?: string | null;
  summary?: string | null;
  reference: {
    entity: string;
    id: string;
  };
}

export const patientsApi = {
  list(params: PatientListParams, instance?: AxiosInstance) {
    return client(instance).get<PatientListResponse>('/api/patients', { params }).then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<PatientRecord>(`/api/patients/${id}`).then((response) => response.data);
  },
  create(payload: PatientPayload, instance?: AxiosInstance) {
    return client(instance).post<PatientRecord>('/api/patients', payload).then((response) => response.data);
  },
  update(id: string, payload: Partial<PatientPayload>, instance?: AxiosInstance) {
    return client(instance).put<PatientRecord>(`/api/patients/${id}`, payload).then((response) => response.data);
  },
  timeline(id: string, instance?: AxiosInstance) {
    return client(instance).get<PatientTimelineItem[]>(`/api/patients/${id}/timeline`).then((response) => response.data);
  },
};
