import { isAxiosError } from 'axios';

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

function firstMessage(message?: string | string[]) {
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    return message.find((item) => typeof item === 'string' && item.trim()) ?? '';
  }
  return '';
}

export function getAuthApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError<ApiErrorBody>(error)) return fallback;

  const data = error.response?.data;
  const message = firstMessage(data?.message) || data?.error || error.message;
  return message?.trim() || fallback;
}

export function isEmailVerificationRequiredError(error: unknown) {
  if (!isAxiosError<ApiErrorBody>(error) || error.response?.status !== 403) return false;

  const message = getAuthApiErrorMessage(error, '').toLowerCase();
  return (
    message.includes('verify') ||
    message.includes('verification') ||
    message.includes('inactive') ||
    message.includes('not active') ||
    message.includes('unverified')
  );
}
