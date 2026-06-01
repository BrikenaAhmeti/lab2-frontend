import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { aiApi } from '@/lib/api/ai-api';

describe('aiApi', () => {
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
