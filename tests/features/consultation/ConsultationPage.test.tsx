import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConsultationPage from '@/features/consultation/pages/ConsultationPage';
import { aiApi, type AiConsultationConversation, type ConsultationSummary } from '@/lib/api/ai-api';
import { appointmentsApi, type AppointmentView } from '@/lib/api/appointments-api';
import { labApi, type LabOrderView, type LabTestView } from '@/lib/api/lab-api';
import { medicalRecordsApi, type MedicalRecordView } from '@/lib/api/medical-records-api';
import { patientsApi, type PatientRecord } from '@/lib/api/patients-api';
import { prescriptionsApi } from '@/lib/api/prescriptions-api';

vi.mock('@/lib/api/appointments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/appointments-api')>('@/lib/api/appointments-api');

  return {
    ...actual,
    appointmentsApi: {
      list: vi.fn(),
      today: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      reschedule: vi.fn(),
      updateStatus: vi.fn(),
      availableSlots: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/patients-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/patients-api')>('@/lib/api/patients-api');

  return {
    ...actual,
    patientsApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      timeline: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/medical-records-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/medical-records-api')>('@/lib/api/medical-records-api');

  return {
    ...actual,
    medicalRecordsApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      finalize: vi.fn(),
      addAmendment: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/prescriptions-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/prescriptions-api')>('@/lib/api/prescriptions-api');

  return {
    ...actual,
    prescriptionsApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      void: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/lab-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/lab-api')>('@/lib/api/lab-api');

  return {
    ...actual,
    labApi: {
      listTests: vi.fn(),
      listOrders: vi.fn(),
      createOrder: vi.fn(),
      pendingOrders: vi.fn(),
      getOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      enterResults: vi.fn(),
      reviewOrder: vi.fn(),
      triggerAi: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/ai-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/ai-api')>('@/lib/api/ai-api');

  return {
    ...actual,
    aiApi: {
      ...actual.aiApi,
      getConsultation: vi.fn(),
      transcribeConsultationAudio: vi.fn(),
      summarizeConsultation: vi.fn(),
      updateConsultationSummary: vi.fn(),
    },
  };
});

const appointment: AppointmentView = {
  id: '11111111-1111-4111-8111-111111111111',
  patientId: '22222222-2222-4222-8222-222222222222',
  departmentId: '33333333-3333-4333-8333-333333333333',
  serviceCatalogId: '44444444-4444-4444-8444-444444444444',
  staffProfileId: '55555555-5555-4555-8555-555555555555',
  status: 'IN_PROGRESS',
  appointmentType: 'IN_PERSON',
  scheduledAt: '2030-01-02T09:00:00.000Z',
  endAt: '2030-01-02T09:30:00.000Z',
  durationMinutes: 30,
  basePrice: 40,
  notes: null,
  checkedInAt: '2030-01-02T08:55:00.000Z',
  completedAt: null,
  cancelledAt: null,
  cancellationNote: null,
  createdAt: '2030-01-01T09:00:00.000Z',
  updatedAt: '2030-01-01T09:00:00.000Z',
  patient: {
    id: '22222222-2222-4222-8222-222222222222',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+38344111222',
    name: 'Ada Lovelace',
  },
  staff: {
    id: '55555555-5555-4555-8555-555555555555',
    userId: 'doctor-user',
    employeeCode: 'DR-1',
    specialization: 'Cardiologist',
    displayName: 'DR-1 - Cardiologist',
  },
  service: {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'General Consultation',
    defaultDurationMinutes: 30,
    defaultPrice: 40,
  },
  department: {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Cardiology',
    isActive: true,
  },
};

const patient: PatientRecord = {
  id: appointment.patientId,
  userId: 'patient-user',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '+38344111222',
  dateOfBirth: '1985-01-01',
  gender: 'female',
  bloodType: 'A_POSITIVE',
  personalNumber: null,
  address: null,
  emergencyContact: null,
  emergencyPhone: null,
  allergies: ['penicillin'],
  medicalNotes: 'Cardiology follow-up',
  isActive: true,
  createdAt: '2030-01-01T09:00:00.000Z',
  updatedAt: '2030-01-01T09:00:00.000Z',
};

const labTest: LabTestView = {
  id: '88888888-8888-4888-8888-888888888888',
  code: 'CBC',
  name: 'Complete Blood Count',
  description: 'Automated blood count with differential.',
  category: 'Hematology',
  sampleType: 'Blood',
  defaultPrice: '45.00',
  referenceRange: 'Hemoglobin 12.0 - 16.0 g/dL',
  isActive: true,
  createdAt: '2030-01-01T09:00:00.000Z',
  updatedAt: '2030-01-01T09:00:00.000Z',
};

const aiSummary: ConsultationSummary = {
  chiefComplaint: 'Chest discomfort',
  historyOfPresentIllness: 'Patient reports intermittent chest discomfort.',
  examinationFindings: 'Stable exam.',
  assessmentAndDiagnosis: 'Stable exam',
  treatmentPlan: 'Continue monitoring',
  followUpInstructions: 'Return if pain worsens',
  aiReview: 'Verify red flags before finalizing.',
};

const aiReportText = `Patient concern
Chest discomfort

History of present illness
Patient reports intermittent chest discomfort.

Examination findings
Stable exam.

Assessment and diagnosis
Stable exam

Treatment plan
Continue monitoring

Follow-up instructions
Return if pain worsens

AI review
Verify red flags before finalizing.`;

function makeAiConversation(overrides: Partial<AiConsultationConversation> = {}): AiConsultationConversation {
  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    staffId: appointment.staffProfileId,
    transcription: 'Patient reports intermittent chest discomfort.',
    summaryStatus: 'draft',
    ...overrides,
  };
}

function makeRecord(overrides: Partial<MedicalRecordView> = {}): MedicalRecordView {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    patientId: appointment.patientId,
    appointmentId: appointment.id,
    staffProfileId: appointment.staffProfileId!,
    departmentId: appointment.departmentId,
    chiefComplaint: 'Chest discomfort',
    vitals: null,
    diagnosis: 'Stable angina',
    treatmentPlan: 'Monitor',
    notes: null,
    followUpInstructions: null,
    isFinalized: false,
    createdAt: '2030-01-02T09:10:00.000Z',
    updatedAt: '2030-01-02T09:10:00.000Z',
    patient: {
      id: patient.id,
      userId: patient.userId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      name: 'Ada Lovelace',
    },
    appointment: {
      id: appointment.id,
      status: 'IN_PROGRESS',
      scheduledAt: appointment.scheduledAt,
      endAt: appointment.endAt,
    },
    staff: appointment.staff!,
    department: appointment.department,
    amendments: [],
    prescriptions: [],
    labOrders: [],
    ...overrides,
  };
}

function makeLabOrder(overrides: Partial<LabOrderView> = {}): LabOrderView {
  return {
    id: '99999999-9999-4999-8999-999999999999',
    patientId: appointment.patientId,
    appointmentId: appointment.id,
    medicalRecordId: null,
    orderedByStaffId: appointment.staffProfileId!,
    departmentId: appointment.departmentId,
    status: 'PENDING',
    priority: 'urgent',
    notes: 'Draw before medication',
    orderedAt: '2030-01-02T09:20:00.000Z',
    collectedAt: null,
    completedAt: null,
    reviewedAt: null,
    createdAt: '2030-01-02T09:20:00.000Z',
    updatedAt: '2030-01-02T09:20:00.000Z',
    patient: {
      id: patient.id,
      userId: patient.userId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      name: 'Ada Lovelace',
    },
    appointment: {
      id: appointment.id,
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
      endAt: appointment.endAt,
    },
    medicalRecord: null,
    orderedByStaff: appointment.staff!,
    department: appointment.department,
    items: [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        labTestId: labTest.id,
        resultValue: null,
        resultUnit: null,
        resultNotes: null,
        resultStatus: 'PENDING',
        isCritical: false,
        completedAt: null,
        flag: 'pending',
        labTest,
      },
    ],
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter initialEntries={[`/doctor/consultations/${appointment.id}`]}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/doctor/consultations/:appointmentId" element={<ConsultationPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ConsultationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appointmentsApi.get).mockResolvedValue(appointment);
    vi.mocked(appointmentsApi.updateStatus).mockResolvedValue({ ...appointment, status: 'COMPLETED' });
    vi.mocked(patientsApi.get).mockResolvedValue(patient);
    vi.mocked(medicalRecordsApi.list).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    vi.mocked(medicalRecordsApi.create).mockResolvedValue(makeRecord());
    vi.mocked(medicalRecordsApi.finalize).mockResolvedValue(makeRecord({ isFinalized: true }));
    vi.mocked(prescriptionsApi.list).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    vi.mocked(labApi.listTests).mockResolvedValue({
      items: [labTest],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(labApi.createOrder).mockResolvedValue(makeLabOrder());
    vi.mocked(prescriptionsApi.create).mockResolvedValue({
      id: '77777777-7777-4777-8777-777777777777',
      patientId: appointment.patientId,
      medicalRecordId: '66666666-6666-4666-8666-666666666666',
      appointmentId: appointment.id,
      staffProfileId: appointment.staffProfileId!,
      issuedAt: '2030-01-02T09:15:00.000Z',
      expiresAt: null,
      notes: null,
      isVoided: false,
      voidedAt: null,
      voidReason: null,
      voidedByUserId: null,
      status: 'ACTIVE',
      pharmacyStatus: 'PENDING',
      createdAt: '2030-01-02T09:15:00.000Z',
      updatedAt: '2030-01-02T09:15:00.000Z',
      patient: {
        id: patient.id,
        userId: patient.userId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        allergies: patient.allergies,
        name: 'Ada Lovelace',
      },
      medicalRecord: {
        id: '66666666-6666-4666-8666-666666666666',
        diagnosis: 'Stable angina',
        isFinalized: false,
        createdAt: '2030-01-02T09:10:00.000Z',
      },
      appointment: {
        id: appointment.id,
        status: 'IN_PROGRESS',
        scheduledAt: appointment.scheduledAt,
        endAt: appointment.endAt,
      },
      staff: appointment.staff!,
      items: [],
      pharmacyQueue: [],
    });
    vi.mocked(aiApi.getConsultation).mockResolvedValue(null);
    vi.mocked(aiApi.summarizeConsultation).mockResolvedValue({
      summary: aiSummary,
      reportText: aiReportText,
      conversation: makeAiConversation({ summary: aiSummary, reportText: aiReportText }),
    });
    vi.mocked(aiApi.updateConsultationSummary).mockResolvedValue(
      makeAiConversation({ summary: aiSummary, reportText: aiReportText })
    );
  });

  it('links back to the doctor dashboard from the consultation', async () => {
    renderPage();

    expect(await screen.findByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/doctor');
  });

  it('creates a medical record with the backend MS-19 field names', async () => {
    renderPage();

    expect(await screen.findAllByText('Ada Lovelace')).not.toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Patient concern'), { target: { value: 'Chest discomfort' } });
    fireEvent.change(screen.getByLabelText('Diagnosis'), { target: { value: 'Stable angina' } });
    fireEvent.change(screen.getByLabelText('Treatment Plan'), { target: { value: 'Monitor chest pain' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create record' }));

    await waitFor(() => {
      expect(medicalRecordsApi.create).toHaveBeenCalledWith({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        staffProfileId: appointment.staffProfileId,
        chiefComplaint: 'Chest discomfort',
        diagnosis: 'Stable angina',
        treatmentPlan: 'Monitor chest pain',
        notes: null,
        followUpInstructions: null,
      });
    });
  });

  it('shows structured patient notes below the recorder without raw JSON', async () => {
    const medicalNotes = JSON.stringify({
      chronicConditions: ['Seasonal asthma'],
      preferredPharmacy: 'MedSphere Pharmacy',
    });
    vi.mocked(patientsApi.get).mockResolvedValue({ ...patient, medicalNotes });

    renderPage();

    const recorderHeading = await screen.findByText('Conversation Recorder');
    const summaryHeading = await screen.findByText('Patient Summary');

    expect(Boolean(recorderHeading.compareDocumentPosition(summaryHeading) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(screen.getByText('Chronic Conditions')).toBeInTheDocument();
    expect(screen.getByText('Seasonal asthma')).toBeInTheDocument();
    expect(screen.getByText('Preferred Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('MedSphere Pharmacy')).toBeInTheDocument();
    expect(screen.queryByText(medicalNotes)).not.toBeInTheDocument();
  });

  it('creates a prescription with the backend MS-20 item shape', async () => {
    renderPage();

    expect(await screen.findAllByText('Ada Lovelace')).not.toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Diagnosis'), { target: { value: 'Stable angina' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create record' }));

    await screen.findByText('Medical record saved.');
    fireEvent.change(screen.getByLabelText('Medication'), { target: { value: 'Aspirin' } });
    fireEvent.change(screen.getByLabelText('Dosage'), { target: { value: '81 mg' } });
    fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'Once daily' } });
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: '30 days' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Instructions'), { target: { value: 'Take after food' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Prescription' }));

    await waitFor(() => {
      expect(prescriptionsApi.create).toHaveBeenCalledWith({
        medicalRecordId: '66666666-6666-4666-8666-666666666666',
        notes: null,
        items: [
          {
            medicationName: 'Aspirin',
            dosage: '81 mg',
            frequency: 'Once daily',
            durationInstructions: '30 days',
            quantityPrescribed: 30,
            notes: 'Take after food',
          },
        ],
      });
    });
  });

  it('creates a lab order with selected backend lab test ids', async () => {
    renderPage();

    expect(await screen.findAllByText('Ada Lovelace')).not.toHaveLength(0);
    fireEvent.change(await screen.findByLabelText('Priority'), { target: { value: 'urgent' } });
    fireEvent.change(screen.getByLabelText('Lab Instructions'), { target: { value: 'Draw before medication' } });

    const createButton = screen.getByRole('button', { name: 'Create Lab Order' });
    expect(createButton).toBeDisabled();

    fireEvent.click(await screen.findByLabelText('Complete Blood Count lab test'));
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(labApi.createOrder).toHaveBeenCalledWith({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        medicalRecordId: null,
        orderedByStaffId: appointment.staffProfileId,
        priority: 'urgent',
        notes: 'Draw before medication',
        tests: [labTest.id],
      });
    });
  });

  it('saves the generated AI report as the appointment record', async () => {
    vi.mocked(aiApi.getConsultation).mockResolvedValue(makeAiConversation({ summary: aiSummary, reportText: aiReportText }));

    renderPage();

    expect(await screen.findAllByText('Ada Lovelace')).not.toHaveLength(0);
    await waitFor(() => {
      expect(screen.getByLabelText('Report text')).toHaveValue(aiReportText);
    });
    const saveAsRecordButton = screen.getByRole('button', { name: 'Save as Record' });
    await waitFor(() => {
      expect(saveAsRecordButton).toBeEnabled();
    });
    fireEvent.click(saveAsRecordButton);

    await waitFor(() => {
      expect(medicalRecordsApi.create).toHaveBeenCalledWith({
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        staffProfileId: appointment.staffProfileId,
        chiefComplaint: 'Chest discomfort',
        diagnosis: 'Stable exam',
        treatmentPlan: 'Continue monitoring',
        notes: aiReportText,
        followUpInstructions: 'Return if pain worsens',
      });
    });
  });
});
