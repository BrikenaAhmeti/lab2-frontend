import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { departmentsApi } from '@/lib/api/departments-api';
import { servicesApi } from '@/lib/api/services-api';
import { staffApi } from '@/lib/api/staff-api';
import {
  appointmentsApi,
  type AppointmentListParams,
  type AppointmentType,
  type BookAppointmentPayload,
  type PublicAppointmentPatientPayload,
  type PublicBookAppointmentPayload,
  type RescheduleAppointmentPayload,
  type UpdateAppointmentStatusPayload,
} from '@/lib/api/appointments-api';
import type { AuthUser } from '@/features/auth/authSlice';
import { publicCoreApiClient } from '@/lib/api/axios';

export type BookingMode = 'patient' | 'receptionist' | 'public';

export const appointmentQueryKey = {
  all: ['appointments'] as const,
  departments: ['appointments', 'departments'] as const,
  services: (departmentId: string) => ['appointments', 'services', departmentId] as const,
  staff: (departmentId: string) => ['appointments', 'staff', departmentId] as const,
  slots: (staffId: string, serviceId: string, date: string) =>
    ['appointments', 'slots', staffId, serviceId, date] as const,
  list: (params: AppointmentListParams) => [...appointmentQueryKey.all, 'list', params] as const,
  today: ['appointments', 'today'] as const,
  detail: (id: string) => [...appointmentQueryKey.all, 'detail', id] as const,
};

export function useAppointmentDepartments(publicAccess = false) {
  return useQuery({
    queryKey: publicAccess ? [...appointmentQueryKey.departments, 'public'] : appointmentQueryKey.departments,
    queryFn: async () => {
      const response = publicAccess
        ? await departmentsApi.publicList({ page: 1, limit: 100, isActive: true }, publicCoreApiClient)
        : await departmentsApi.list({ page: 1, limit: 100, isActive: true });
      return response.items;
    },
    retry: false,
  });
}

export function useAppointmentServices(departmentId: string, publicAccess = false) {
  return useQuery({
    queryKey: publicAccess
      ? [...appointmentQueryKey.services(departmentId), 'public']
      : appointmentQueryKey.services(departmentId),
    queryFn: async () => {
      const response = publicAccess
        ? await servicesApi.publicList({ page: 1, limit: 100, departmentId, isActive: true }, publicCoreApiClient)
        : await servicesApi.list({ page: 1, limit: 100, departmentId, isActive: true });
      return response.items;
    },
    enabled: Boolean(departmentId),
    retry: false,
  });
}

export function useAppointmentStaff(departmentId: string, publicAccess = false) {
  return useQuery({
    queryKey: publicAccess ? [...appointmentQueryKey.staff(departmentId), 'public'] : appointmentQueryKey.staff(departmentId),
    queryFn: async () => {
      const response = await staffApi.publicList(
        { page: 1, limit: 100, departmentId },
        publicAccess ? publicCoreApiClient : undefined
      );
      return response.items;
    },
    enabled: Boolean(departmentId),
    retry: false,
  });
}

export function useAvailableSlots(staffId: string, serviceId: string, date: string, enabled: boolean, publicAccess = false) {
  return useQuery({
    queryKey: publicAccess
      ? [...appointmentQueryKey.slots(staffId, serviceId, date), 'public']
      : appointmentQueryKey.slots(staffId, serviceId, date),
    queryFn: () =>
      publicAccess
        ? appointmentsApi.publicAvailableSlots(staffId, { date, serviceId }, publicCoreApiClient)
        : appointmentsApi.availableSlots(staffId, { date, serviceId }),
    enabled: enabled && Boolean(staffId && serviceId && date),
    refetchInterval: enabled ? 30000 : false,
    retry: false,
  });
}

export function useAppointmentList(params: AppointmentListParams, enabled = true) {
  return useQuery({
    queryKey: appointmentQueryKey.list(params),
    queryFn: () => appointmentsApi.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: appointmentQueryKey.today,
    queryFn: () => appointmentsApi.today(),
    refetchInterval: 30000,
    retry: false,
  });
}

export function useAppointmentDetail(id: string) {
  return useQuery({
    queryKey: appointmentQueryKey.detail(id),
    queryFn: () => appointmentsApi.get(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BookAppointmentPayload) => appointmentsApi.create(payload),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
      queryClient.setQueryData(appointmentQueryKey.detail(appointment.id), appointment);
    },
    retry: false,
  });
}

export function usePublicBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PublicBookAppointmentPayload) => appointmentsApi.publicCreate(payload),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
      queryClient.setQueryData(appointmentQueryKey.detail(appointment.id), appointment);
    },
    retry: false,
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleAppointmentPayload }) =>
      appointmentsApi.reschedule(id, payload),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
      queryClient.setQueryData(appointmentQueryKey.detail(appointment.id), appointment);
    },
    retry: false,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentStatusPayload }) =>
      appointmentsApi.updateStatus(id, payload),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
      queryClient.setQueryData(appointmentQueryKey.detail(appointment.id), appointment);
    },
    retry: false,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsApi.updateStatus(id, { action: 'cancel', reason }),
    onSuccess: async (appointment) => {
      await queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
      queryClient.setQueryData(appointmentQueryKey.detail(appointment.id), appointment);
    },
    retry: false,
  });
}

export function resolvePatientId(user: AuthUser | null | undefined) {
  return user?.patientId ?? user?.patientProfileId ?? user?.profileId ?? user?.id ?? '';
}

export function buildAppointmentPayload(input: {
  patientId: string;
  serviceCatalogId: string;
  staffProfileId: string;
  scheduledAt: string;
  appointmentType?: AppointmentType;
  notes?: string;
}): BookAppointmentPayload {
  const notes = input.notes?.trim();

  return {
    patientId: input.patientId,
    serviceCatalogId: input.serviceCatalogId,
    staffProfileId: input.staffProfileId,
    scheduledAt: input.scheduledAt,
    ...(input.appointmentType ? { appointmentType: input.appointmentType } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function buildPublicAppointmentPayload(input: {
  patient: PublicAppointmentPatientPayload;
  serviceCatalogId: string;
  staffProfileId: string;
  scheduledAt: string;
  appointmentType?: AppointmentType;
  notes?: string;
}): PublicBookAppointmentPayload {
  const notes = input.notes?.trim();

  return {
    patient: input.patient,
    serviceCatalogId: input.serviceCatalogId,
    staffProfileId: input.staffProfileId,
    scheduledAt: input.scheduledAt,
    ...(input.appointmentType ? { appointmentType: input.appointmentType } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function canConfirmBooking(input: {
  patientId?: string;
  serviceCatalogId?: string;
  staffProfileId?: string;
  scheduledAt?: string;
}) {
  return Boolean(input.patientId && input.serviceCatalogId && input.staffProfileId && input.scheduledAt);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 409) return 'That appointment slot is no longer available';
    if (error.response?.status === 400) return 'Please review the appointment details and try again';
    if (error.response?.status === 403) return 'You do not have access to this appointment action';
    if (error.response?.status === 404) return 'Appointment details could not be found';
  }

  return fallback;
}
