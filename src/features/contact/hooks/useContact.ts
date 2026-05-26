import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  contactApi,
  type ContactListParams,
  type SubmitContactPayload,
  type UpdateContactStatusPayload,
} from '@/lib/api/contact-api';

export const contactQueryKey = {
  all: ['contact'] as const,
  list: (params: ContactListParams) => [...contactQueryKey.all, 'list', params] as const,
};

export function useContactList(params: ContactListParams, enabled = true) {
  return useQuery({
    queryKey: contactQueryKey.list(params),
    queryFn: () => contactApi.list(params),
    enabled,
    placeholderData: (previousData) => previousData,
    retry: false,
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (payload: SubmitContactPayload) => contactApi.submit(payload),
    retry: false,
  });
}

export function useUpdateContactStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContactStatusPayload }) =>
      contactApi.updateStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contactQueryKey.all });
    },
    retry: false,
  });
}

export function getContactApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
  }

  return fallback;
}
