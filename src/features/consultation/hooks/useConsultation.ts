import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  aiApi,
  type ConsultationSummaryPayload,
  type ConsultationTranscribeMetadata,
  type UpdateConsultationSummaryPayload,
} from '@/lib/api/ai-api';
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
  aiConsultations: ['consultation', 'ai-consultations'] as const,
  aiConsultation: (appointmentId: string) => [...consultationQueryKey.aiConsultations, appointmentId] as const,
  prescriptions: ['consultation', 'prescriptions'] as const,
  prescriptionList: (params: ListPrescriptionsParams) =>
    [...consultationQueryKey.prescriptions, 'list', params] as const,
};

export function useAiConsultation(appointmentId: string, enabled = true) {
  return useQuery({
    queryKey: consultationQueryKey.aiConsultation(appointmentId),
    queryFn: () => aiApi.getConsultation(appointmentId),
    enabled: enabled && Boolean(appointmentId),
    retry: false,
  });
}

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

export function useTranscribeConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ audio, metadata }: { audio: Blob; metadata: ConsultationTranscribeMetadata }) =>
      aiApi.transcribeConsultationAudio(audio, metadata),
    onSuccess: async (_transcription, variables) => {
      if (variables.metadata.appointmentId) {
        await queryClient.invalidateQueries({
          queryKey: consultationQueryKey.aiConsultation(variables.metadata.appointmentId),
        });
      }
    },
    retry: false,
  });
}

export function useSummarizeConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConsultationSummaryPayload) => aiApi.summarizeConsultation(payload),
    onSuccess: async (_summary, payload) => {
      await queryClient.invalidateQueries({
        queryKey: consultationQueryKey.aiConsultation(payload.appointmentId),
      });
    },
    retry: false,
  });
}

export function useUpdateAiConsultationSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: UpdateConsultationSummaryPayload }) =>
      aiApi.updateConsultationSummary(appointmentId, payload),
    onSuccess: async (conversation) => {
      queryClient.setQueryData(consultationQueryKey.aiConsultation(conversation.appointmentId), conversation);
      await queryClient.invalidateQueries({ queryKey: consultationQueryKey.aiConsultations });
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
