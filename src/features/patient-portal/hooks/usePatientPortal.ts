import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { aiApi } from '@/lib/api/ai-api';

export const patientPortalQueryKey = {
  all: ['patient-portal'] as const,
  labInterpretation: (labOrderId: string) =>
    [...patientPortalQueryKey.all, 'lab-interpretation', labOrderId] as const,
};

export function usePatientLabInterpretation(labOrderId: string, enabled: boolean) {
  return useQuery({
    queryKey: patientPortalQueryKey.labInterpretation(labOrderId),
    queryFn: () => aiApi.getLabInterpretation(labOrderId),
    enabled: enabled && Boolean(labOrderId),
    retry: false,
    refetchInterval: (query) => (query.state.data === null ? 15000 : false),
  });
}

export function getPatientPortalErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;

    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.find((item) => typeof item === 'string') ?? fallback;
    if (error.response?.status === 403) return 'You do not have access to this patient information';
    if (error.response?.status === 404) return 'This patient information is not available yet';
  }

  return fallback;
}
