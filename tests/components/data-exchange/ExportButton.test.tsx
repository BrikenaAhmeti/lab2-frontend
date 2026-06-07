import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExportButton from '@/components/export/ExportButton';
import { dataExchangeApi, downloadFile } from '@/lib/api/data-exchange-api';

vi.mock('@/lib/api/data-exchange-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/data-exchange-api')>('@/lib/api/data-exchange-api');

  return {
    ...actual,
    downloadFile: vi.fn(),
    dataExchangeApi: {
      ...actual.dataExchangeApi,
      exportFile: vi.fn(),
    },
  };
});

function renderExportButton(props: Partial<ComponentProps<typeof ExportButton>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ExportButton entity="patients" {...props} />
    </QueryClientProvider>
  );
}

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataExchangeApi.exportFile).mockResolvedValue({
      blob: new Blob(['patient data']),
      filename: 'patients.xlsx',
    });
  });

  it('exports the selected format and saves the downloaded file', async () => {
    renderExportButton();

    fireEvent.change(screen.getByLabelText('Export format'), { target: { value: 'xlsx' } });
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    await waitFor(() => {
      expect(dataExchangeApi.exportFile).toHaveBeenCalledWith('patients', 'xlsx');
    });
    expect(downloadFile).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      filename: 'patients.xlsx',
    });
  });

  it('passes hidden fields to the export endpoint when configured', async () => {
    renderExportButton({ excludeFields: ['userId'] });

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    await waitFor(() => {
      expect(dataExchangeApi.exportFile).toHaveBeenCalledWith('patients', 'csv', { excludeFields: ['userId'] });
    });
  });
});
