import type { AxiosInstance } from 'axios';
import type { AppointmentStatus } from './appointments-api';
import { coreApiClient } from './axios';

export interface MedicalRecordPatientSummary {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  name: string;
}

export interface MedicalRecordStaffSummary {
  id: string;
  userId: string;
  employeeCode: string;
  specialization: string | null;
  displayName: string;
}

export interface MedicalRecordPrescriptionSummary {
  id: string;
  issuedAt: string;
  expiresAt: string | null;
  notes: string | null;
  items: Array<{
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    durationInstructions: string | null;
    quantityPrescribed: number;
    quantityDispensed: number | null;
    notes: string | null;
  }>;
}

export interface MedicalRecordView {
  id: string;
  patientId: string;
  appointmentId: string | null;
  staffProfileId: string;
  departmentId: string;
  chiefComplaint: string | null;
  vitals: unknown;
  diagnosis: string | null;
  treatmentPlan: string | null;
  notes: string | null;
  followUpInstructions: string | null;
  isFinalized: boolean;
  createdAt: string;
  updatedAt: string;
  patient: MedicalRecordPatientSummary;
  appointment: {
    id: string;
    status: AppointmentStatus;
    scheduledAt: string;
    endAt: string;
  } | null;
  staff: MedicalRecordStaffSummary;
  department: {
    id: string;
    name: string;
    isActive: boolean;
  };
  amendments: Array<{
    id: string;
    medicalRecordId: string;
    amendedByUserId: string;
    reason: string;
    previousSnapshot: unknown;
    createdAt: string;
    updatedAt: string;
  }>;
  prescriptions: MedicalRecordPrescriptionSummary[];
  labOrders: Array<{
    id: string;
    status: string;
    priority: string | null;
    notes: string | null;
    orderedAt: string;
    completedAt: string | null;
    reviewedAt: string | null;
    items: Array<{
      id: string;
      resultValue: string | null;
      resultUnit: string | null;
      resultNotes: string | null;
      resultStatus: string;
      isCritical: boolean;
      completedAt: string | null;
      labTest: {
        id: string;
        code: string;
        name: string;
      };
    }>;
  }>;
}

export interface MedicalRecordListResponse {
  items: MedicalRecordView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MedicalRecordFieldsPayload {
  chiefComplaint?: string | null;
  vitals?: unknown;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  notes?: string | null;
  followUpInstructions?: string | null;
}

export interface CreateMedicalRecordPayload extends MedicalRecordFieldsPayload {
  patientId: string;
  appointmentId: string;
  staffProfileId: string;
}

export interface ListMedicalRecordsParams {
  page?: number;
  limit?: number;
  patientId?: string;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const medicalRecordsApi = {
  list(params: ListMedicalRecordsParams, instance?: AxiosInstance) {
    return client(instance)
      .get<MedicalRecordListResponse>('/api/medical-records', { params })
      .then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<MedicalRecordView>(`/api/medical-records/${id}`).then((response) => response.data);
  },
  create(payload: CreateMedicalRecordPayload, instance?: AxiosInstance) {
    return client(instance).post<MedicalRecordView>('/api/medical-records', payload).then((response) => response.data);
  },
  update(id: string, payload: MedicalRecordFieldsPayload, instance?: AxiosInstance) {
    return client(instance).put<MedicalRecordView>(`/api/medical-records/${id}`, payload).then((response) => response.data);
  },
  finalize(id: string, instance?: AxiosInstance) {
    return client(instance).post<MedicalRecordView>(`/api/medical-records/${id}/finalize`).then((response) => response.data);
  },
  addAmendment(
    id: string,
    payload: { reason: string; changes: MedicalRecordFieldsPayload },
    instance?: AxiosInstance
  ) {
    return client(instance)
      .post(`/api/medical-records/${id}/amendments`, payload)
      .then((response) => response.data);
  },
  downloadPdf(id: string, instance?: AxiosInstance) {
    return client(instance)
      .get<Blob>(`/api/medical-records/${id}/pdf`, { responseType: 'blob' })
      .then((response) => response.data);
  },
};
