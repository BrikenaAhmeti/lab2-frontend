import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export const pharmacyQueueStatusFilters = [
  'pending',
  'on_hold',
  'in_progress',
  'partially_dispensed',
  'dispensed',
  'fulfilled',
  'cancelled',
] as const;

export type PharmacyQueueStatusFilter = (typeof pharmacyQueueStatusFilters)[number];

export type PharmacyStatus =
  | 'PENDING'
  | 'ON_HOLD'
  | 'IN_PROGRESS'
  | 'PARTIALLY_DISPENSED'
  | 'DISPENSED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'OUT_OF_STOCK'
  | 'SUBSTITUTED';

export type PharmacyDispensingStatusInput = 'dispensed' | 'out_of_stock' | 'substituted';

export interface PharmacyPatientSummary {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  allergies: unknown;
  name: string;
}

export interface PharmacyStaffSummary {
  id: string;
  userId: string;
  employeeCode: string;
  specialization: string | null;
  displayName: string;
}

export interface PharmacyPrescriptionSummary {
  id: string;
  issuedAt: string;
  expiresAt: string | null;
  notes: string | null;
  isVoided: boolean;
  staff: PharmacyStaffSummary;
}

export interface PharmacyPrescriptionItemSummary {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationInstructions: string | null;
  quantityPrescribed: number;
  quantityDispensed: number | null;
  notes: string | null;
}

export interface PharmacyInventoryItemSummary {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number | string | null;
  isActive: boolean;
}

export interface PharmacyDispensingItemView {
  id: string;
  pharmacyQueueId: string;
  prescriptionItemId: string;
  inventoryItemId: string | null;
  quantityToDispense: number;
  quantityDispensed: number | null;
  status: PharmacyStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  prescriptionItem: PharmacyPrescriptionItemSummary;
  inventoryItem: PharmacyInventoryItemSummary | null;
}

export interface PharmacyQueueView {
  id: string;
  prescriptionId: string;
  patientId: string;
  status: PharmacyStatus;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  patient: PharmacyPatientSummary;
  prescription: PharmacyPrescriptionSummary;
  dispensingItems: PharmacyDispensingItemView[];
}

export interface PharmacyQueueListParams {
  page?: number;
  limit?: number;
  status?: PharmacyQueueStatusFilter;
}

export interface PharmacyQueueListResponse {
  items: PharmacyQueueView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DispensePharmacyQueuePayload {
  items: Array<{
    prescriptionItemId: string;
    inventoryItemId?: string | null;
    quantityDispensed: number;
    status: PharmacyDispensingStatusInput;
    notes?: string | null;
  }>;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const pharmacyApi = {
  listQueue(params: PharmacyQueueListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<PharmacyQueueListResponse>('/api/pharmacy/queue', { params })
      .then((response) => response.data);
  },
  getQueueItem(id: string, instance?: AxiosInstance) {
    return client(instance).get<PharmacyQueueView>(`/api/pharmacy/queue/${id}`).then((response) => response.data);
  },
  startQueue(id: string, instance?: AxiosInstance) {
    return client(instance).patch<PharmacyQueueView>(`/api/pharmacy/queue/${id}/start`).then((response) => response.data);
  },
  dispenseQueue(id: string, payload: DispensePharmacyQueuePayload, instance?: AxiosInstance) {
    return client(instance)
      .post<PharmacyQueueView>(`/api/pharmacy/queue/${id}/dispense`, payload)
      .then((response) => response.data);
  },
  fulfillQueue(id: string, instance?: AxiosInstance) {
    return client(instance).patch<PharmacyQueueView>(`/api/pharmacy/queue/${id}/fulfill`).then((response) => response.data);
  },
};
