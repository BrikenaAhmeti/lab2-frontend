import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NurseMedicalRecordsPage from '@/features/medical-records/pages/NurseMedicalRecordsPage';
import { medicalRecordsApi, type MedicalRecordView } from '@/lib/api/medical-records-api';

vi.mock('@/lib/api/medical-records-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/medical-records-api')>('@/lib/api/medical-records-api');

  return {
    ...actual,
    medicalRecordsApi: {
      ...actual.medicalRecordsApi,
      list: vi.fn(),
    },
  };
});

const finalizedRecord: MedicalRecordView = {
  id: 'record-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  staffProfileId: 'doctor-1',
  departmentId: 'department-1',
  chiefComplaint: 'Dental pain',
  vitals: { bloodPressure: '120/80' },
  diagnosis: 'Stable exam',
  treatmentPlan: 'Continue monitoring',
  notes: 'Follow up if symptoms return',
  followUpInstructions: 'Return in two weeks',
  isFinalized: true,
  createdAt: '2026-05-02T09:20:00.000Z',
  updatedAt: '2026-05-02T09:20:00.000Z',
  patient: {
    id: 'patient-1',
    userId: 'user-1',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
  },
  appointment: {
    id: 'appointment-1',
    status: 'COMPLETED',
    scheduledAt: '2026-05-02T09:00:00.000Z',
    endAt: '2026-05-02T09:30:00.000Z',
  },
  staff: {
    id: 'doctor-1',
    userId: 'doctor-user',
    employeeCode: 'DR-1',
    specialization: 'Dentistry',
    displayName: 'Dr. Lira',
  },
  department: {
    id: 'department-1',
    name: 'Dental Care',
    isActive: true,
  },
  amendments: [],
  prescriptions: [
    {
      id: 'prescription-1',
      issuedAt: '2026-05-02T09:30:00.000Z',
      expiresAt: null,
      notes: null,
      items: [
        {
          id: 'item-1',
          medicationName: 'Ibuprofen',
          dosage: '200 mg',
          frequency: 'Twice daily',
          durationInstructions: null,
          quantityPrescribed: 10,
          quantityDispensed: null,
          notes: null,
        },
      ],
    },
  ],
  labOrders: [],
};

const draftRecord: MedicalRecordView = {
  ...finalizedRecord,
  id: 'record-2',
  patientId: 'patient-2',
  diagnosis: 'Respiratory review',
  isFinalized: false,
  patient: {
    id: 'patient-2',
    userId: 'user-2',
    firstName: 'Ben',
    lastName: 'Gashi',
    email: 'ben@example.com',
    phone: null,
    name: 'Ben Gashi',
  },
  prescriptions: [],
};

function renderPage(initialEntry = '/nurse/medical-records') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/nurse/medical-records" element={<NurseMedicalRecordsPage />} />
          <Route path="/nurse/medical-records/:id" element={<NurseMedicalRecordsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('NurseMedicalRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(medicalRecordsApi.list).mockResolvedValue({
      items: [finalizedRecord, draftRecord],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
  });

  it('renders medical-record details and links nurses to the patient profile', async () => {
    renderPage('/nurse/medical-records/record-1');

    expect((await screen.findAllByText('Stable exam')).length).toBeGreaterThan(0);
    expect(screen.getByText('Continue monitoring')).toBeInTheDocument();
    expect(screen.getByText('Ibuprofen 200 mg')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Arta Krasniqi' })).toHaveAttribute(
      'href',
      '/nurse/patients/patient-1?tab=medical'
    );
    expect(medicalRecordsApi.list).toHaveBeenCalledWith({ page: 1, limit: 100 });
  });

  it('filters records by status and search text', async () => {
    renderPage();

    expect((await screen.findAllByText('Stable exam')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Respiratory review').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'draft' } });

    await waitFor(() => {
      expect(screen.queryAllByText('Stable exam')).toHaveLength(0);
      expect(screen.getAllByText('Respiratory review').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'missing diagnosis' } });

    expect(await screen.findByText('No medical records match these filters.')).toBeInTheDocument();
  });
});
