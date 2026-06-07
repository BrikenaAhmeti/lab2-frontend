import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  billingApi,
  type BillingListParams,
  type BillingStatsParams,
  type MarkBillingPaidPayload,
  type UpdateBillingPayload,
} from '@/lib/api/billing-api';

export const billingQueryKey = {
  all: ['billings'] as const,
  list: (params: BillingListParams) => [...billingQueryKey.all, 'list', params] as const,
  detail: (id: string) => [...billingQueryKey.all, 'detail', id] as const,
  stats: (params: BillingStatsParams) => [...billingQueryKey.all, 'stats', params] as const,
};

export function useBillingList(params: BillingListParams, enabled = true) {
  return useQuery({
    queryKey: billingQueryKey.list(params),
    queryFn: () => billingApi.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useBillingDetail(id: string) {
  return useQuery({
    queryKey: billingQueryKey.detail(id),
    queryFn: () => billingApi.get(id),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useBillingStats(params: BillingStatsParams, enabled = true) {
  return useQuery({
    queryKey: billingQueryKey.stats(params),
    queryFn: () => billingApi.stats(params),
    enabled,
    retry: false,
  });
}

export function useUpdateBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBillingPayload }) => billingApi.update(id, payload),
    onSuccess: async (billing) => {
      queryClient.setQueryData(billingQueryKey.detail(billing.id), billing);
      await queryClient.invalidateQueries({ queryKey: billingQueryKey.all });
    },
    retry: false,
  });
}

export function useMarkBillingPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkBillingPaidPayload }) => billingApi.markPaid(id, payload),
    onSuccess: async (billing) => {
      queryClient.setQueryData(billingQueryKey.detail(billing.id), billing);
      await queryClient.invalidateQueries({ queryKey: billingQueryKey.all });
    },
    retry: false,
  });
}

export function getBillingApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const message = data?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 400) return 'Please review the billing details and try again';
    if (error.response?.status === 403) return 'You do not have access to this billing action';
    if (error.response?.status === 404) return 'Billing record could not be found';
    if (error.response?.status === 409) return 'This billing record cannot be changed now';
  }

  return fallback;
}
