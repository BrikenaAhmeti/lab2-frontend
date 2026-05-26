import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { appointmentsApi } from '@/lib/api/appointments-api';
import { buildContactPayload, buildContactStatusPayload, contactApi } from '@/lib/api/contact-api';
import { buildSubmitFeedbackPayload, feedbackApi } from '@/lib/api/feedback-api';

function mockClient() {
  return {
    get: vi.fn().mockResolvedValue({ data: { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } } }),
    post: vi.fn().mockResolvedValue({ data: { id: 'saved' } }),
    patch: vi.fn().mockResolvedValue({ data: { id: 'updated' } }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };
}

describe('MS-53 API helpers', () => {
  it('builds and posts the feedback submission payload', async () => {
    const instance = mockClient();
    const payload = buildSubmitFeedbackPayload({
      appointmentId: 'e61720ab-6446-4da3-a4bc-f642940e4a81',
      rating: 5,
      comment: ' Helpful doctor ',
      isAnonymous: true,
    });

    expect(payload).toEqual({
      appointmentId: 'e61720ab-6446-4da3-a4bc-f642940e4a81',
      rating: 5,
      comment: 'Helpful doctor',
      isAnonymous: true,
    });

    await feedbackApi.submit(payload, instance);

    expect(instance.post).toHaveBeenCalledWith('/api/feedback', payload);
  });

  it('updates feedback status with the backend moderation payload', async () => {
    const instance = mockClient();

    await feedbackApi.updateStatus('8b7610e7-5223-4c86-97f1-22817b08e54d', { status: 'published' }, instance);

    expect(instance.patch).toHaveBeenCalledWith('/api/feedback/8b7610e7-5223-4c86-97f1-22817b08e54d/status', {
      status: 'published',
    });
  });

  it('builds and posts the public contact payload', async () => {
    const instance = mockClient();
    const payload = buildContactPayload({
      name: ' Ada Lovelace ',
      email: ' ada@example.com ',
      phone: ' ',
      subject: ' Appointment question ',
      message: ' Can I move my appointment? ',
    });

    expect(payload).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Appointment question',
      message: 'Can I move my appointment?',
    });

    await contactApi.submit(payload, instance);

    expect(instance.post).toHaveBeenCalledWith('/api/contact', payload);
  });

  it('requires reply notes before building a replied contact status payload', () => {
    expect(buildContactStatusPayload({ status: 'replied', replyNotes: '  ' })).toBeNull();
    expect(buildContactStatusPayload({ status: 'replied', replyNotes: ' Answered by email ' })).toEqual({
      status: 'replied',
      replyNotes: 'Answered by email',
    });
  });

  it('queries completed appointments without feedback for the patient prompt', async () => {
    const instance = mockClient();
    const params = { page: 1, limit: 3, status: 'COMPLETED' as const, hasNoFeedback: true };

    await appointmentsApi.list(params, instance);

    expect(instance.get).toHaveBeenCalledWith('/api/appointments', { params });
  });
});
