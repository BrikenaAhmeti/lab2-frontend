import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImportWizard from '@/components/import/ImportWizard';
import { dataExchangeApi, downloadFile, type ImportResult } from '@/lib/api/data-exchange-api';

vi.mock('@/lib/api/data-exchange-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/data-exchange-api')>('@/lib/api/data-exchange-api');

  return {
    ...actual,
    downloadFile: vi.fn(),
    dataExchangeApi: {
      ...actual.dataExchangeApi,
      downloadTemplate: vi.fn(),
      importFile: vi.fn(),
      getImportJob: vi.fn(),
    },
  };
});

const completedResult: ImportResult = {
  entity: 'patients',
  mode: 'lenient',
  status: 'completed',
  totalRows: 10,
  importedRows: 8,
  skippedRows: 2,
  errors: [
    {
      row: 4,
      field: 'email',
      reason: 'email already exists',
    },
  ],
};

function renderWizard(onCompleted = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ImportWizard
        open
        entity="patients"
        title="Import Patients"
        onClose={vi.fn()}
        onCompleted={onCompleted}
      />
    </QueryClientProvider>
  );

  return { onCompleted };
}

function uploadPatientFile() {
  const file = new File(['firstName,lastName,email\nAda,Lovelace,ada@example.com'], 'patients.csv', {
    type: 'text/csv',
  });
  fireEvent.change(screen.getByLabelText('Upload file'), { target: { files: [file] } });
  return file;
}

describe('ImportWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dataExchangeApi.downloadTemplate).mockResolvedValue({
      blob: new Blob(['template']),
      filename: 'patients-template.csv',
    });
    vi.mocked(dataExchangeApi.importFile).mockResolvedValue({
      status: 200,
      data: completedResult,
    });
  });

  it('downloads templates with the selected format', async () => {
    renderWizard();

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'xlsx' } });
    fireEvent.click(screen.getByRole('button', { name: 'Download Template' }));

    await waitFor(() => {
      expect(dataExchangeApi.downloadTemplate).toHaveBeenCalledWith('patients', 'xlsx');
    });
    expect(downloadFile).toHaveBeenCalledWith({
      blob: expect.any(Blob),
      filename: 'patients-template.csv',
    });
  });

  it('submits a file import and shows the backend summary with row errors', async () => {
    const { onCompleted } = renderWizard();
    const file = uploadPatientFile();

    fireEvent.click(screen.getByRole('radio', { name: /Lenient/i }));
    fireEvent.click(screen.getByRole('button', { name: /Submit Import/i }));

    await waitFor(() => {
      expect(dataExchangeApi.importFile).toHaveBeenCalledWith('patients', { file, mode: 'lenient' });
    });
    expect(await screen.findByText('email already exists')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(onCompleted).toHaveBeenCalledTimes(1);
  });

  it('polls an async import job until it returns a completed result', async () => {
    vi.mocked(dataExchangeApi.importFile).mockResolvedValueOnce({
      status: 202,
      data: {
        id: 'job-1',
        entity: 'patients',
        mode: 'strict',
        status: 'queued',
        createdAt: '2026-05-29T10:00:00.000Z',
      },
    });
    vi.mocked(dataExchangeApi.getImportJob).mockResolvedValue({
      id: 'job-1',
      entity: 'patients',
      mode: 'strict',
      status: 'completed',
      createdAt: '2026-05-29T10:00:00.000Z',
      completedAt: '2026-05-29T10:01:00.000Z',
      result: { ...completedResult, mode: 'strict' },
    });

    renderWizard();
    uploadPatientFile();
    fireEvent.click(screen.getByRole('button', { name: /Submit Import/i }));

    expect(await screen.findByText('email already exists')).toBeInTheDocument();
    expect(dataExchangeApi.getImportJob).toHaveBeenCalledWith('job-1');
  });
});
