import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export type SearchResource =
  | 'patients'
  | 'appointments'
  | 'lab-orders'
  | 'inventory-items'
  | 'staff'
  | 'audit-logs';

export type SearchSortOrder = 'asc' | 'desc';

export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SearchSortOrder;
  [key: string]: string | number | boolean | undefined;
}

export interface SearchListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PatientSearchItem {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  personalNumber?: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  bloodType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSearchItem {
  id: string;
  patientId: string;
  departmentId: string;
  serviceCatalogId: string;
  staffProfileId: string | null;
  status: string;
  scheduledAt: string;
  endAt: string;
  durationMinutes: number;
  basePrice: number;
  appointmentType: string;
  patient: {
    id: string;
    userId: string | null;
    name: string;
    email: string | null;
    phone: string | null;
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
  service: {
    id: string;
    name: string;
  };
}

export interface LabOrderSearchItem {
  id: string;
  patientId: string;
  orderedByStaffId: string;
  departmentId: string;
  status: string;
  priority: string | null;
  orderedAt: string;
  collectedAt: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  hasCritical: boolean;
  testCount: number;
  patient: {
    id: string;
    userId: string | null;
    name: string;
    email: string | null;
    phone: string | null;
  };
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
  };
}

export interface InventoryItemSearchItem {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number | null;
  expiryDate: string | null;
  isActive: boolean;
  stockLevel: string;
  category: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  } | null;
}

export interface StaffSearchItem {
  id: string;
  userId: string;
  employeeCode: string;
  specialization: string | null;
  licenseNumber: string | null;
  employmentStatus: string;
  hireDate: string | null;
  isPublicProfile: boolean;
  displayName: string;
  positionType: {
    id: string;
    name: string;
    defaultRoleKey: string;
  };
  departments: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
}

export interface AuditLogSearchItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: unknown;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export const advancedSearchApi = {
  search<T>(resource: SearchResource, params: SearchParams, instance?: AxiosInstance) {
    return client(instance)
      .get<SearchListResponse<T>>(`/api/search/${resource}`, { params })
      .then((response) => response.data);
  },
};
