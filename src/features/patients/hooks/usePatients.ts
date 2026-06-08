import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { patientsApi, type PatientListParams, type PatientPayload, type PatientRecord } from '@/lib/api/patients-api';

export const patientQueryKey = {
  all: ['patients'] as const,
  list: (params: PatientListParams) => [...patientQueryKey.all, 'list', params] as const,
  detail: (id: string) => [...patientQueryKey.all, 'detail', id] as const,
  timeline: (id: string) => [...patientQueryKey.detail(id), 'timeline'] as const,
};

export function usePatientList(params: PatientListParams) {
  return useQuery({
    queryKey: patientQueryKey.list(params),
    queryFn: () => patientsApi.list(params),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function usePatientDetail(id: string) {
  return useQuery({
    queryKey: patientQueryKey.detail(id),
    queryFn: () => patientsApi.get(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function usePatientSelfProfile(patientId: string) {
  return useQuery({
    queryKey: patientQueryKey.detail(patientId),
    queryFn: () => patientsApi.get(patientId),
    enabled: Boolean(patientId),
    retry: false,
  });
}

export function usePatientTimeline(id: string) {
  return useQuery({
    queryKey: patientQueryKey.timeline(id),
    queryFn: () => patientsApi.timeline(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatientPayload) => patientsApi.create(payload),
    onSuccess: async (patient) => {
      await queryClient.invalidateQueries({ queryKey: patientQueryKey.all });
      queryClient.setQueryData(patientQueryKey.detail(patient.id), patient);
    },
    retry: false,
  });
}

export function getPatientName(patient: Pick<PatientRecord, 'firstName' | 'lastName' | 'email'>) {
  return [patient.firstName, patient.lastName].filter(Boolean).join(' ') || patient.email || 'Patient';
}

export function toPatientPayload(values: Record<string, string>): PatientPayload {
  const text = (value: string) => value.trim() || null;

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: text(values.email),
    phone: text(values.phone),
    dateOfBirth: text(values.dateOfBirth),
    gender: text(values.gender),
    bloodType: (text(values.bloodType) as PatientPayload['bloodType']) ?? null,
    personalNumber: values.personalNumber.trim(),
    address: text(values.address),
    emergencyContact: text(values.emergencyContact),
    emergencyPhone: text(values.emergencyPhone),
    allergies: text(values.allergies),
    medicalNotes: text(values.medicalNotes),
  };
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 409) return 'A patient with this email or personal number already exists';
    if (error.response?.status === 404) return 'Patient could not be found';
    if (error.response?.status === 403) return 'You do not have access to this patient profile';
  }

  return fallback;
}
