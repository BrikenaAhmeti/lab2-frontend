import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConsultationRecorder from '@/features/consultation/components/ConsultationRecorder';
import { aiApi } from '@/lib/api/ai-api';
import type { AppointmentView } from '@/lib/api/appointments-api';

vi.mock('@/lib/api/ai-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/ai-api')>('@/lib/api/ai-api');

  return {
    ...actual,
    aiApi: {
      ...actual.aiApi,
      getConsultation: vi.fn(),
      transcribeConsultationAudio: vi.fn(),
      summarizeConsultation: vi.fn(),
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

class FakeMediaRecorder {
  static isTypeSupported = vi.fn((type: string) => type === 'audio/webm');

  readonly mimeType: string;
  state: RecordingState = 'inactive';
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType }) } as BlobEvent);
    this.onstop?.();
  }
}

function renderRecorder() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ConsultationRecorder appointment={appointment} />
    </QueryClientProvider>
  );
}

describe('ConsultationRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:consultation-audio'),
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(aiApi.getConsultation).mockResolvedValue(null);
    vi.mocked(aiApi.transcribeConsultationAudio).mockResolvedValue({
      text: 'Patient reports intermittent chest discomfort.',
      model: 'whisper-1',
      conversationTurns: [
        { speaker: 'doctor', text: 'What brings you in today?' },
        { speaker: 'patient', text: 'I have intermittent chest discomfort.' },
      ],
      audioFileUrl: 'http://localhost:3010/uploads/consultation-audio/file.webm',
    });
    vi.mocked(aiApi.summarizeConsultation).mockResolvedValue({
      summary: {
        chiefComplaint: 'Chest discomfort',
        historyOfPresentIllness: 'Patient reports intermittent chest discomfort.',
        examinationFindings: 'Stable exam.',
        assessmentAndDiagnosis: 'Stable exam',
        treatmentPlan: 'Continue monitoring',
        followUpInstructions: 'Return if pain worsens',
      },
      reportText: 'Chief complaint\nChest discomfort',
      conversation: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        staffId: appointment.staffProfileId,
        transcription: 'Patient reports intermittent chest discomfort.',
        summaryStatus: 'draft',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves the recording immediately and generates a draft AI summary after transcription succeeds', async () => {
    let resolveTranscription: (value: Awaited<ReturnType<typeof aiApi.transcribeConsultationAudio>>) => void = () => {};
    vi.mocked(aiApi.transcribeConsultationAudio).mockReturnValue(
      new Promise((resolve) => {
        resolveTranscription = resolve;
      })
    );
    renderRecorder();

    fireEvent.click(screen.getByRole('button', { name: 'Start Recording' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Stop Recording' }));

    await waitFor(() => {
      expect(aiApi.transcribeConsultationAudio).toHaveBeenCalled();
    });
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(await screen.findByText('Recording saved. AI is transcribing the conversation now.')).toBeInTheDocument();

    await act(async () => {
      resolveTranscription({
        text: 'Patient reports intermittent chest discomfort.',
        model: 'whisper-1',
        conversationTurns: [
          { speaker: 'doctor', text: 'What brings you in today?' },
          { speaker: 'patient', text: 'I have intermittent chest discomfort.' },
        ],
        audioFileUrl: 'http://localhost:3010/uploads/consultation-audio/file.webm',
      });
    });

    await waitFor(() => {
      expect(aiApi.summarizeConsultation).toHaveBeenCalledWith({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        staffId: appointment.staffProfileId,
        transcription: 'Patient reports intermittent chest discomfort.',
      });
    });

    expect(await screen.findByText('Doctor')).toBeInTheDocument();
    expect(await screen.findByText('What brings you in today?')).toBeInTheDocument();
    expect(await screen.findByText('Patient')).toBeInTheDocument();
    expect(await screen.findByText('I have intermittent chest discomfort.')).toBeInTheDocument();
  });

  it('does not show stored demo transcripts as real conversation text', async () => {
    vi.mocked(aiApi.getConsultation).mockResolvedValue({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      staffId: appointment.staffProfileId,
      transcription: `Stub transcription generated for consultation-${appointment.id}.webm.`,
      summaryStatus: 'draft',
    });

    renderRecorder();

    expect(await screen.findByText('Previous transcript was generated in demo mode. Record again to replace it.')).toBeInTheDocument();
    expect(screen.queryByText(`Stub transcription generated for consultation-${appointment.id}.webm.`)).not.toBeInTheDocument();
  });
});
