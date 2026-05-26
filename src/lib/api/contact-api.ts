import type { AxiosInstance } from 'axios';
import { coreApiClient } from './axios';

export type ContactMessageStatus = 'new' | 'read' | 'replied';

export interface ContactMessageView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  replyNotes: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListParams {
  page?: number;
  limit?: number;
  status?: ContactMessageStatus;
}

export interface ContactListResponse {
  items: ContactMessageView[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmitContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
}

export interface UpdateContactStatusPayload {
  status: ContactMessageStatus;
  replyNotes?: string;
}

function client(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

export function buildContactPayload(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): SubmitContactPayload {
  const phone = input.phone?.trim();

  return {
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    ...(phone ? { phone } : {}),
  };
}

export function buildContactStatusPayload(input: {
  status: ContactMessageStatus;
  replyNotes?: string;
}): UpdateContactStatusPayload | null {
  const replyNotes = input.replyNotes?.trim();

  if (input.status !== 'replied') {
    return { status: input.status };
  }

  if (!replyNotes) {
    return null;
  }

  return {
    status: input.status,
    ...(replyNotes ? { replyNotes } : {}),
  };
}

export const contactApi = {
  submit(payload: SubmitContactPayload, instance?: AxiosInstance) {
    return client(instance).post<ContactMessageView>('/api/contact', payload).then((response) => response.data);
  },
  list(params: ContactListParams, instance?: AxiosInstance) {
    return client(instance).get<ContactListResponse>('/api/contact', { params }).then((response) => response.data);
  },
  updateStatus(id: string, payload: UpdateContactStatusPayload, instance?: AxiosInstance) {
    return client(instance).patch<ContactMessageView>(`/api/contact/${id}/status`, payload).then((response) => response.data);
  },
};
