import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { appointmentQueryKey } from '@/features/appointments/hooks/useAppointments';
import { appointmentsApi, type AppointmentListResponse } from '@/lib/api/appointments-api';
import {
  feedbackApi,
  type FeedbackListParams,
  type SubmitFeedbackPayload,
  type UpdateFeedbackStatusPayload,
} from '@/lib/api/feedback-api';

export const feedbackQueryKey = {
  all: ['feedback'] as const,
  list: (params: FeedbackListParams) => [...feedbackQueryKey.all, 'list', params] as const,
  my: (params: Pick<FeedbackListParams, 'page' | 'limit'>) => [...feedbackQueryKey.all, 'my', params] as const,
};

export function useMyFeedback(params: Pick<FeedbackListParams, 'page' | 'limit'>) {
  return useQuery({
    queryKey: feedbackQueryKey.my(params),
    queryFn: () => feedbackApi.my(params),
    retry: false,
  });
}

export function useFeedbackList(params: FeedbackListParams, enabled = true) {
  return useQuery({
    queryKey: feedbackQueryKey.list(params),
    queryFn: () => feedbackApi.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function usePendingFeedbackAppointments(limit = 10, patientId?: string, enabled = true) {
  const params = {
    page: 1,
    limit,
    status: 'COMPLETED' as const,
    hasNoFeedback: true,
    ...(patientId ? { patientId } : {}),
  };

  return useQuery<AppointmentListResponse>({
    queryKey: appointmentQueryKey.list(params),
    queryFn: () => appointmentsApi.list(params),
    enabled,
    retry: false,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitFeedbackPayload) => feedbackApi.submit(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedbackQueryKey.all });
      await queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
    },
    retry: false,
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFeedbackStatusPayload }) =>
      feedbackApi.updateStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: feedbackQueryKey.all });
    },
    retry: false,
  });
}

export function getFeedbackApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 409) return 'Feedback was already submitted for this appointment';
  }

  return fallback;
}
