import type { AxiosInstance } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { dataExchangeApi } from '@/lib/api/data-exchange-api';

function mockClient() {
  return {
    get: vi.fn().mockResolvedValue({
      data: new Blob(['firstName\nAda']),
      headers: {
        'content-disposition': 'attachment; filename="patients-2026-05-29.csv"',
      },
    }),
    post: vi.fn().mockResolvedValue({
      status: 202,
      data: {
        id: 'job-1',
        entity: 'patients',
        mode: 'lenient',
        status: 'queued',
        createdAt: '2026-05-29T10:00:00.000Z',
      },
    }),
  } as unknown as AxiosInstance & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
}

describe('dataExchangeApi', () => {
  it('downloads exports from the backend data exchange route', async () => {
    const instance = mockClient();

    const file = await dataExchangeApi.exportFile('patients', 'csv', instance);

    expect(instance.get).toHaveBeenCalledWith('/api/export/patients', {
      params: { format: 'csv' },
      responseType: 'blob',
    });
    expect(file.filename).toBe('patients-2026-05-29.csv');
  });

  it('downloads service catalog exports from the backend data exchange route', async () => {
    const instance = mockClient();

    await dataExchangeApi.exportFile('service-catalog', 'xlsx', instance);

    expect(instance.get).toHaveBeenCalledWith('/api/export/service-catalog', {
      params: { format: 'xlsx' },
      responseType: 'blob',
    });
  });

  it('sends excluded export fields as a backend query parameter', async () => {
    const instance = mockClient();

    await dataExchangeApi.exportFile('patients', 'csv', { excludeFields: ['userId'] }, instance);

    expect(instance.get).toHaveBeenCalledWith('/api/export/patients', {
      params: { format: 'csv', excludeFields: 'userId' },
      responseType: 'blob',
    });
  });

  it('sends selected export filters as backend query parameters', async () => {
    const instance = mockClient();

    await dataExchangeApi.exportFile(
      'inventory-items',
      'xlsx',
      {
        filters: {
          search: 'aspirin',
          categoryId: 'category-1',
          belowReorderLevel: true,
          isActive: false,
          expiryFrom: '2026-12-01',
          expiryTo: '2026-12-31',
          empty: '',
        },
      },
      instance
    );

    expect(instance.get).toHaveBeenCalledWith('/api/export/inventory-items', {
      params: {
        search: 'aspirin',
        categoryId: 'category-1',
        belowReorderLevel: true,
        isActive: false,
        expiryFrom: '2026-12-01',
        expiryTo: '2026-12-31',
        format: 'xlsx',
      },
      responseType: 'blob',
    });
  });

  it('posts multipart imports with the backend file field and mode query', async () => {
    const instance = mockClient();
    const file = new File(['firstName,lastName\nAda,Lovelace'], 'patients.csv', { type: 'text/csv' });

    await dataExchangeApi.importFile('patients', { file, mode: 'lenient' }, instance);

    expect(instance.post).toHaveBeenCalledWith(
      '/api/import/patients',
      expect.any(FormData),
      { params: { mode: 'lenient', async: undefined } }
    );
    const formData = instance.post.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
  });

  it('uses the import template and job status routes', async () => {
    const instance = mockClient();

    await dataExchangeApi.downloadTemplate('lab-tests', 'xlsx', instance);
    await dataExchangeApi.getImportJob('job-1', instance);

    expect(instance.get).toHaveBeenNthCalledWith(1, '/api/import/template/lab-tests', {
      params: { format: 'xlsx' },
      responseType: 'blob',
    });
    expect(instance.get).toHaveBeenNthCalledWith(2, '/api/import/jobs/job-1');
  });
});
