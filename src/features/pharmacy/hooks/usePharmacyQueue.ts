import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  pharmacyApi,
  type DispensePharmacyQueuePayload,
  type PharmacyQueueListParams,
} from '@/lib/api/pharmacy-api';

export const pharmacyQueryKey = {
  all: ['pharmacy-queue'] as const,
  list: (params: PharmacyQueueListParams) => [...pharmacyQueryKey.all, 'list', params] as const,
  detail: (id: string) => [...pharmacyQueryKey.all, 'detail', id] as const,
};

export function usePharmacyQueue(params: PharmacyQueueListParams) {
  return useQuery({
    queryKey: pharmacyQueryKey.list(params),
    queryFn: () => pharmacyApi.listQueue(params),
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function usePharmacyQueueItem(id: string) {
  return useQuery({
    queryKey: pharmacyQueryKey.detail(id),
    queryFn: () => pharmacyApi.getQueueItem(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useStartPharmacyQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pharmacyApi.startQueue(id),
    onSuccess: async (queue) => {
      queryClient.setQueryData(pharmacyQueryKey.detail(queue.id), queue);
      await queryClient.invalidateQueries({ queryKey: pharmacyQueryKey.all });
    },
    retry: false,
  });
}

export function useDispensePharmacyQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DispensePharmacyQueuePayload }) =>
      pharmacyApi.dispenseQueue(id, payload),
    onSuccess: async (queue) => {
      queryClient.setQueryData(pharmacyQueryKey.detail(queue.id), queue);
      await queryClient.invalidateQueries({ queryKey: pharmacyQueryKey.all });
    },
    retry: false,
  });
}

export function useFulfillPharmacyQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pharmacyApi.fulfillQueue(id),
    onSuccess: async (queue) => {
      queryClient.setQueryData(pharmacyQueryKey.detail(queue.id), queue);
      await queryClient.invalidateQueries({ queryKey: pharmacyQueryKey.all });
    },
    retry: false,
  });
}

export function getPharmacyApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 403) return 'You do not have access to this pharmacy action';
    if (error.response?.status === 409) return 'This pharmacy queue item cannot move to that state yet';
    if (error.response?.status === 404) return 'Pharmacy queue item could not be found';
  }

  return fallback;
}
