import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export type LabOrderStatus = 'PENDING' | 'COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type LabOrderStatusInput = 'pending' | 'sample_collected' | 'collected' | 'in_progress' | 'completed' | 'cancelled';
export type LabOrderPriority = 'normal' | 'urgent';
export type LabResultStatus = 'PENDING' | 'ENTERED' | 'REVIEWED' | 'ABNORMAL' | 'CRITICAL';
export type LabResultFlag = 'pending' | 'normal' | 'abnormal' | 'critical' | 'unavailable';

export interface LabTestView {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  sampleType: string | null;
  defaultPrice: number | string | null;
  referenceRange: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabOrderItemView {
  id: string;
  labTestId: string;
  resultValue: string | null;
  resultUnit: string | null;
  resultNotes: string | null;
  resultStatus: LabResultStatus;
  isCritical: boolean;
  completedAt: string | null;
  flag: LabResultFlag;
  labTest: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    sampleType: string | null;
    defaultPrice: number | string | null;
    referenceRange: string | null;
    isActive: boolean;
  };
}

export interface LabOrderView {
  id: string;
  patientId: string;
  appointmentId: string | null;
  medicalRecordId: string | null;
  orderedByStaffId: string;
  departmentId: string;
  status: LabOrderStatus;
  priority: LabOrderPriority | null;
  notes: string | null;
  orderedAt: string;
  collectedAt: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    name: string;
  };
  appointment: {
    id: string;
    status: string;
    scheduledAt: string;
    endAt: string;
  } | null;
  medicalRecord: {
    id: string;
    diagnosis: string | null;
    isFinalized: boolean;
    createdAt: string;
  } | null;
  orderedByStaff: {
    id: string;
    userId: string;
    employeeCode: string;
    specialization: string | null;
    displayName: string;
  };
  department: {
    id: string;
    name: string;
    isActive: boolean;
  };
  items: LabOrderItemView[];
}

export interface LabOrderListParams {
  page?: number;
  limit?: number;
  patientId?: string;
  status?: LabOrderStatusInput;
  priority?: LabOrderPriority;
  from?: string;
  to?: string;
}

export interface LabTestListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface LabTestListResponse {
  items: LabTestView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LabOrderListResponse {
  items: LabOrderView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateLabOrderPayload {
  patientId: string;
  appointmentId: string;
  medicalRecordId?: string | null;
  orderedByStaffId: string;
  priority?: LabOrderPriority | null;
  notes?: string | null;
  tests: string[];
}

export interface EnterLabResultsPayload {
  items: Array<{
    itemId: string;
    resultValue: string;
    resultUnit?: string | null;
    resultNotes?: string | null;
  }>;
}

export interface ReviewLabOrderPayload {
  notes?: string | null;
}

export interface TriggerLabOrderAiResponse {
  labOrderId: string;
  status: string;
  message?: string;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const labApi = {
  listTests(params: LabTestListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<LabTestListResponse>('/api/lab-tests', { params })
      .then((response) => response.data);
  },
  listOrders(params: LabOrderListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<LabOrderListResponse>('/api/lab-orders', { params })
      .then((response) => response.data);
  },
  createOrder(payload: CreateLabOrderPayload, instance?: AxiosInstance) {
    return client(instance).post<LabOrderView>('/api/lab-orders', payload).then((response) => response.data);
  },
  pendingOrders(instance?: AxiosInstance) {
    return client(instance).get<LabOrderView[]>('/api/lab-orders/pending').then((response) => response.data);
  },
  getOrder(id: string, instance?: AxiosInstance) {
    return client(instance).get<LabOrderView>(`/api/lab-orders/${id}`).then((response) => response.data);
  },
  updateOrderStatus(id: string, status: LabOrderStatusInput, instance?: AxiosInstance) {
    return client(instance)
      .patch<LabOrderView>(`/api/lab-orders/${id}/status`, { status })
      .then((response) => response.data);
  },
  enterResults(id: string, payload: EnterLabResultsPayload, instance?: AxiosInstance) {
    return client(instance).put<LabOrderView>(`/api/lab-orders/${id}/results`, payload).then((response) => response.data);
  },
  reviewOrder(id: string, payload: ReviewLabOrderPayload, instance?: AxiosInstance) {
    return client(instance).post<LabOrderView>(`/api/lab-orders/${id}/review`, payload).then((response) => response.data);
  },
  triggerAi(id: string, instance?: AxiosInstance) {
    return client(instance)
      .post<TriggerLabOrderAiResponse>(`/api/lab-orders/${id}/trigger-ai`)
      .then((response) => response.data);
  },
};
