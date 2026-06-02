import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { aiApi } from '@/lib/api/ai-api';

describe('aiApi', () => {
  it('uploads consultation audio using the AI service multipart contract', async () => {
    const post = vi.fn().mockResolvedValue({
      data: {
        text: 'Transcript',
        model: 'stub-transcription',
        audioFileUrl: 'http://localhost:3010/uploads/consultation-audio/file.webm',
      },
    });
    const instance = {
      post,
    } as unknown as AxiosInstance;

    const audio = new Blob(['audio'], { type: 'audio/webm' });
    await expect(
      aiApi.transcribeConsultationAudio(
        audio,
        {
          appointmentId: 'appointment-1',
          patientId: 'patient-1',
          staffId: 'staff-1',
          fileName: 'visit.webm',
        },
        instance
      )
    ).resolves.toEqual(expect.objectContaining({ text: 'Transcript' }));

    const [url, formData] = post.mock.calls[0];
    expect(url).toBe('/api/ai/transcribe');
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get('appointmentId')).toBe('appointment-1');
    expect((formData as FormData).get('patientId')).toBe('patient-1');
    expect((formData as FormData).get('staffId')).toBe('staff-1');
  });

  it('returns null when an AI consultation has not been created yet', async () => {
    const instance = {
      get: vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      }),
    } as unknown as AxiosInstance;

    await expect(aiApi.getConsultation('appointment-1', instance)).resolves.toBeNull();
  });

  it('returns null when lab interpretation is not ready yet', async () => {
    const instance = {
      get: vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      }),
    } as unknown as AxiosInstance;

    await expect(aiApi.getLabInterpretation('lab-order-1', instance)).resolves.toBeNull();
  });

  it('normalizes AI service interpretation field aliases', async () => {
    const instance = {
      get: vi.fn().mockResolvedValue({
        data: {
          interpretation: {
            labOrderId: 'lab-order-1',
            clinicalInterpretation: 'Clinical summary',
            patientInterpretation: 'Patient summary',
            createdAt: '2030-01-02T09:00:00.000Z',
          },
        },
      }),
    } as unknown as AxiosInstance;

    await expect(aiApi.getLabInterpretation('lab-order-1', instance)).resolves.toEqual(
      expect.objectContaining({
        labOrderId: 'lab-order-1',
        clinicalVersion: 'Clinical summary',
        patientVersion: 'Patient summary',
        generatedAt: '2030-01-02T09:00:00.000Z',
      })
    );
  });
});
