import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  medicalRecordsApi,
  type CreateMedicalRecordPayload,
  type ListMedicalRecordsParams,
  type MedicalRecordFieldsPayload,
} from '@/lib/api/medical-records-api';
import {
  prescriptionsApi,
  type CreatePrescriptionPayload,
  type ListPrescriptionsParams,
} from '@/lib/api/prescriptions-api';

export const consultationQueryKey = {
  medicalRecords: ['consultation', 'medical-records'] as const,
  medicalRecordList: (params: ListMedicalRecordsParams) =>
    [...consultationQueryKey.medicalRecords, 'list', params] as const,
  medicalRecordDetail: (id: string) => [...consultationQueryKey.medicalRecords, 'detail', id] as const,
  prescriptions: ['consultation', 'prescriptions'] as const,
  prescriptionList: (params: ListPrescriptionsParams) =>
    [...consultationQueryKey.prescriptions, 'list', params] as const,
};

export function useMedicalRecords(params: ListMedicalRecordsParams, enabled = true) {
  return useQuery({
    queryKey: consultationQueryKey.medicalRecordList(params),
    queryFn: () => medicalRecordsApi.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function usePrescriptions(params: ListPrescriptionsParams, enabled = true) {
  return useQuery({
    queryKey: consultationQueryKey.prescriptionList(params),
    queryFn: () => prescriptionsApi.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMedicalRecordPayload) => medicalRecordsApi.create(payload),
    onSuccess: async (record) => {
      queryClient.setQueryData(consultationQueryKey.medicalRecordDetail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: consultationQueryKey.medicalRecords });
    },
    retry: false,
  });
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MedicalRecordFieldsPayload }) =>
      medicalRecordsApi.update(id, payload),
    onSuccess: async (record) => {
      queryClient.setQueryData(consultationQueryKey.medicalRecordDetail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: consultationQueryKey.medicalRecords });
    },
    retry: false,
  });
}

export function useFinalizeMedicalRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicalRecordsApi.finalize(id),
    onSuccess: async (record) => {
      queryClient.setQueryData(consultationQueryKey.medicalRecordDetail(record.id), record);
      await queryClient.invalidateQueries({ queryKey: consultationQueryKey.medicalRecords });
    },
    retry: false,
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePrescriptionPayload) => prescriptionsApi.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: consultationQueryKey.prescriptions }),
        queryClient.invalidateQueries({ queryKey: consultationQueryKey.medicalRecords }),
      ]);
    },
    retry: false,
  });
}

export function getConsultationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 403) return 'You do not have access to this clinical action';
    if (error.response?.status === 404) return 'Clinical details could not be found';
    if (error.response?.status === 409) return 'This record can no longer be changed directly';
  }

  return fallback;
}
