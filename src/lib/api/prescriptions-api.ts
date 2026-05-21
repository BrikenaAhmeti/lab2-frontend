import type { AxiosInstance } from 'axios';
import type { AppointmentStatus } from './appointments-api';
import { coreApiClient } from './axios';

export type PrescriptionLifecycleStatus = 'ACTIVE' | 'VOIDED';
export type PharmacyStatus = 'PENDING' | 'ON_HOLD' | 'PARTIALLY_DISPENSED' | 'DISPENSED' | 'CANCELLED';

export interface PrescriptionItemView {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationInstructions: string | null;
  quantityPrescribed: number;
  quantityDispensed: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionView {
  id: string;
  patientId: string;
  medicalRecordId: string | null;
  appointmentId: string | null;
  staffProfileId: string;
  issuedAt: string;
  expiresAt: string | null;
  notes: string | null;
  isVoided: boolean;
  voidedAt: string | null;
  voidReason: string | null;
  voidedByUserId: string | null;
  status: PrescriptionLifecycleStatus;
  pharmacyStatus: PharmacyStatus | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    allergies: unknown;
    name: string;
  };
  medicalRecord: {
    id: string;
    diagnosis: string | null;
    isFinalized: boolean;
    createdAt: string;
  } | null;
  appointment: {
    id: string;
    status: AppointmentStatus;
    scheduledAt: string;
    endAt: string;
  } | null;
  staff: {
    id: string;
    userId: string;
    employeeCode: string;
    specialization: string | null;
    displayName: string;
  };
  items: PrescriptionItemView[];
  pharmacyQueue: Array<{
    id: string;
    status: PharmacyStatus;
    requestedAt: string;
    processedAt: string | null;
    notes: string | null;
    dispensingItems: Array<{
      id: string;
      prescriptionItemId: string;
      quantityToDispense: number;
      quantityDispensed: number | null;
      status: PharmacyStatus;
      notes: string | null;
    }>;
  }>;
}

export interface PrescriptionListResponse {
  items: PrescriptionView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PrescriptionItemPayload {
  medicationName: string;
  dosage: string;
  frequency: string;
  durationInstructions?: string | null;
  quantityPrescribed: number;
  notes?: string | null;
}

export interface CreatePrescriptionPayload {
  medicalRecordId: string;
  expiresAt?: string | null;
  notes?: string | null;
  items: PrescriptionItemPayload[];
}

export interface ListPrescriptionsParams {
  page?: number;
  limit?: number;
  patientId?: string;
  isVoided?: boolean;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const prescriptionsApi = {
  list(params: ListPrescriptionsParams, instance?: AxiosInstance) {
    return client(instance)
      .get<PrescriptionListResponse>('/api/prescriptions', { params })
      .then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<PrescriptionView>(`/api/prescriptions/${id}`).then((response) => response.data);
  },
  create(payload: CreatePrescriptionPayload, instance?: AxiosInstance) {
    return client(instance).post<PrescriptionView>('/api/prescriptions', payload).then((response) => response.data);
  },
  void(id: string, reason: string, instance?: AxiosInstance) {
    return client(instance)
      .post<PrescriptionView>(`/api/prescriptions/${id}/void`, { reason })
      .then((response) => response.data);
  },
};
