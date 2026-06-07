import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export const billingStatuses = ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE'] as const;
export type BillingStatus = (typeof billingStatuses)[number];

export const paymentMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export interface BillingItemView {
  id: string;
  billingId: string;
  serviceCatalogId: string | null;
  inventoryItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentView {
  id: string;
  billingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string | null;
  paidAt: string;
  receivedByUserId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingView {
  id: string;
  patientId: string;
  appointmentId: string | null;
  billingNumber: string;
  status: BillingStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  outstandingAmount: number;
  dueDate: string | null;
  issuedAt: string;
  paidAt: string | null;
  notes: string | null;
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
    service: {
      id: string;
      name: string;
    };
  } | null;
  items: BillingItemView[];
  payments: PaymentView[];
}

export interface BillingListParams {
  page?: number;
  limit?: number;
  patientId?: string;
  search?: string;
  status?: BillingStatus;
  from?: string;
  to?: string;
}

export interface BillingListResponse {
  items: BillingView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BillingStats {
  totalRevenue: number;
  outstanding: number;
  statusCounts: Record<BillingStatus, number>;
}

export interface BillingStatsParams {
  from?: string;
  to?: string;
}

export interface UpdateBillingPayload {
  taxAmount?: number;
  discountAmount?: number;
  dueDate?: string | null;
  notes?: string | null;
  items?: Array<{
    serviceCatalogId?: string | null;
    inventoryItemId?: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
  }>;
}

export interface MarkBillingPaidPayload {
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const billingApi = {
  list(params: BillingListParams, instance?: AxiosInstance) {
    return client(instance)
      .get<BillingListResponse>('/api/billings', { params })
      .then((response) => response.data);
  },
  get(id: string, instance?: AxiosInstance) {
    return client(instance).get<BillingView>(`/api/billings/${id}`).then((response) => response.data);
  },
  update(id: string, payload: UpdateBillingPayload, instance?: AxiosInstance) {
    return client(instance).put<BillingView>(`/api/billings/${id}`, payload).then((response) => response.data);
  },
  markPaid(id: string, payload: MarkBillingPaidPayload = {}, instance?: AxiosInstance) {
    return client(instance)
      .post<BillingView>(`/api/billings/${id}/mark-paid`, payload)
      .then((response) => response.data);
  },
  stats(params: BillingStatsParams, instance?: AxiosInstance) {
    return client(instance)
      .get<BillingStats>('/api/billings/stats', { params })
      .then((response) => response.data);
  },
  downloadPdf(id: string, instance?: AxiosInstance) {
    return client(instance)
      .get<Blob>(`/api/billings/${id}/pdf`, { responseType: 'blob' })
      .then((response) => response.data);
  },
};
