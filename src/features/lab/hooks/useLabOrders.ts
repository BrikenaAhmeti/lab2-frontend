import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  labApi,
  type EnterLabResultsPayload,
  type LabOrderListParams,
  type LabOrderStatusInput,
  type ReviewLabOrderPayload,
} from '@/lib/api/lab-api';

export const labQueryKey = {
  all: ['lab-orders'] as const,
  pending: ['lab-orders', 'pending'] as const,
  list: (params: LabOrderListParams) => [...labQueryKey.all, 'list', params] as const,
  detail: (id: string) => [...labQueryKey.all, 'detail', id] as const,
};

export function usePendingLabOrders() {
  return useQuery({
    queryKey: labQueryKey.pending,
    queryFn: () => labApi.pendingOrders(),
    refetchInterval: 30000,
    retry: false,
  });
}

export function useLabOrders(params: LabOrderListParams, enabled = true) {
  return useQuery({
    queryKey: labQueryKey.list(params),
    queryFn: () => labApi.listOrders(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useLabOrder(id: string) {
  return useQuery({
    queryKey: labQueryKey.detail(id),
    queryFn: () => labApi.getOrder(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useUpdateLabOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LabOrderStatusInput }) => labApi.updateOrderStatus(id, status),
    onSuccess: async (order) => {
      queryClient.setQueryData(labQueryKey.detail(order.id), order);
      await queryClient.invalidateQueries({ queryKey: labQueryKey.all });
    },
    retry: false,
  });
}

export function useEnterLabResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EnterLabResultsPayload }) => labApi.enterResults(id, payload),
    onSuccess: async (order) => {
      queryClient.setQueryData(labQueryKey.detail(order.id), order);
      await queryClient.invalidateQueries({ queryKey: labQueryKey.all });
    },
    retry: false,
  });
}

export function useReviewLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewLabOrderPayload }) => labApi.reviewOrder(id, payload),
    onSuccess: async (order) => {
      queryClient.setQueryData(labQueryKey.detail(order.id), order);
      await queryClient.invalidateQueries({ queryKey: labQueryKey.all });
    },
    retry: false,
  });
}

export function useTriggerLabOrderAi() {
  return useMutation({
    mutationFn: (id: string) => labApi.triggerAi(id),
    retry: false,
  });
}

export function getLabApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 403) return 'You do not have access to this lab action';
    if (error.response?.status === 409) return 'The lab order cannot move to that state yet';
    if (error.response?.status === 404) return 'Lab order could not be found';
  }

  return fallback;
}
