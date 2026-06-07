import { isAxiosError, type AxiosInstance } from 'axios';
import { aiApiClient } from './axios';

export interface ConsultationSummary {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  examinationFindings: string;
  assessmentAndDiagnosis: string;
  treatmentPlan: string;
  followUpInstructions: string;
}

export interface AiConsultationConversation {
  _id?: string;
  appointmentId: string;
  patientId?: string | null;
  staffId?: string | null;
  audioFileUrl?: string | null;
  audioOriginalName?: string | null;
  audioMimeType?: string | null;
  audioSizeBytes?: number | null;
  transcription?: string | null;
  summary?: ConsultationSummary | null;
  reportText?: string | null;
  summaryStatus?: 'draft' | 'approved' | 'discarded';
  keywords?: string[];
  models?: {
    transcription?: string | null;
    summary?: string | null;
  };
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TranscriptionView {
  text: string;
  model: string;
  audioFileUrl?: string | null;
}

export interface ConsultationSummaryResponse {
  summary: ConsultationSummary;
  reportText?: string | null;
  conversation?: AiConsultationConversation | null;
}

export interface ConsultationTranscribeMetadata {
  appointmentId?: string;
  patientId?: string;
  staffId?: string;
  fileName?: string;
}

export interface ConsultationSummaryPayload {
  appointmentId: string;
  patientId?: string;
  staffId?: string;
  transcription: string;
  context?: Record<string, unknown>;
}

export interface UpdateConsultationSummaryPayload {
  reportText?: string;
  summary?: Partial<ConsultationSummary>;
  summaryStatus?: 'draft' | 'approved' | 'discarded';
}

export interface LabInterpretationView {
  labOrderId: string;
  patientVersion?: string | null;
  clinicalVersion?: string | null;
  disclaimer?: string | null;
  recommendations?: string[];
  riskFlags?: string[];
  generatedAt?: string | null;
}

export interface AiAgentMessagePayload {
  sessionId?: string;
  message: string;
  userId?: string;
  patientId?: string;
}

export interface AiAgentMessageResponse {
  sessionId: string;
  reply: string;
  outcome?: 'in_progress' | 'booked' | 'abandoned' | 'referred';
  appointmentId?: string;
  session?: unknown;
}

export interface VapiCallLogMessage {
  role: string;
  message: string;
  time?: number | null;
  endTime?: number | null;
  secondsFromStart?: number | null;
  duration?: number | null;
  speakerLabel?: string | null;
}

export interface VapiCallRecordingUrls {
  stereoUrl?: string | null;
  monoCombinedUrl?: string | null;
  assistantUrl?: string | null;
  customerUrl?: string | null;
  videoUrl?: string | null;
  legacyRecordingUrl?: string | null;
}

export interface VapiCallLogView {
  id: string;
  type?: string | null;
  status?: string | null;
  assistantId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  endedReason?: string | null;
  durationSeconds?: number | null;
  cost?: number | null;
  summary?: string | null;
  transcript?: string | null;
  messages: VapiCallLogMessage[];
  recordingUrls: VapiCallRecordingUrls;
  logUrl?: string | null;
  pcapUrl?: string | null;
}

export interface VapiCallListResponse {
  assistantId?: string | null;
  count: number;
  calls: VapiCallLogView[];
}

export interface VapiArtifactLogResponse {
  callId: string;
  logUrl: string;
  contentType: string;
  body: unknown;
}

type LabInterpretationPayload = LabInterpretationView & {
  patientInterpretation?: string | null;
  patientFriendlyVersion?: string | null;
  clinicalInterpretation?: string | null;
  createdAt?: string | null;
};

type LabInterpretationEnvelope = {
  data?: LabInterpretationPayload | null;
  interpretation?: LabInterpretationPayload | null;
};

function client(instance?: AxiosInstance) {
  return instance ?? aiApiClient;
}

function normalizeLabInterpretation(value?: LabInterpretationPayload | null): LabInterpretationView | null {
  if (!value) return null;

  return {
    ...value,
    patientVersion: value.patientVersion ?? value.patientInterpretation ?? value.patientFriendlyVersion ?? null,
    clinicalVersion: value.clinicalVersion ?? value.clinicalInterpretation ?? null,
    generatedAt: value.generatedAt ?? value.createdAt ?? null,
  };
}

function isLabInterpretationEnvelope(
  value: LabInterpretationPayload | LabInterpretationEnvelope
): value is LabInterpretationEnvelope {
  return 'data' in value || 'interpretation' in value;
}

function unwrapLabInterpretation(value?: LabInterpretationPayload | LabInterpretationEnvelope | null) {
  if (!value) return null;
  if (isLabInterpretationEnvelope(value)) return normalizeLabInterpretation(value.data ?? value.interpretation);
  return normalizeLabInterpretation(value);
}

export const aiApi = {
  transcribeConsultationAudio(
    audio: Blob,
    metadata: ConsultationTranscribeMetadata = {},
    instance?: AxiosInstance
  ) {
    const formData = new FormData();
    const fileName = metadata.fileName ?? 'consultation.webm';

    formData.append('audio', audio, fileName);
    if (metadata.appointmentId) formData.append('appointmentId', metadata.appointmentId);
    if (metadata.patientId) formData.append('patientId', metadata.patientId);
    if (metadata.staffId) formData.append('staffId', metadata.staffId);

    return client(instance)
      .post<TranscriptionView>('/api/ai/transcribe', formData)
      .then((response) => response.data);
  },
  summarizeConsultation(payload: ConsultationSummaryPayload, instance?: AxiosInstance) {
    return client(instance)
      .post<ConsultationSummaryResponse>('/api/ai/summarize', payload)
      .then((response) => response.data);
  },
  getConsultation(appointmentId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<AiConsultationConversation>(`/api/ai/consultations/${appointmentId}`)
      .then((response) => response.data)
      .catch((error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }

        throw error;
      });
  },
  updateConsultationSummary(
    appointmentId: string,
    payload: UpdateConsultationSummaryPayload,
    instance?: AxiosInstance
  ) {
    return client(instance)
      .put<AiConsultationConversation>(`/api/ai/consultations/${appointmentId}/summary`, payload)
      .then((response) => response.data);
  },
  getLabInterpretation(labOrderId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<LabInterpretationPayload | LabInterpretationEnvelope>(`/api/ai/lab-results/${labOrderId}/interpretation`)
      .then((response) => unwrapLabInterpretation(response.data))
      .catch((error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }

        throw error;
      });
  },
  sendAgentMessage(payload: AiAgentMessagePayload, instance?: AxiosInstance) {
    return client(instance)
      .post<AiAgentMessageResponse>('/api/ai/agent/message', payload)
      .then((response) => response.data);
  },
  listVapiCalls(params: { limit?: number; assistantId?: string } = {}, instance?: AxiosInstance) {
    return client(instance)
      .get<VapiCallListResponse>('/api/ai/vapi/calls', { params })
      .then((response) => response.data);
  },
  getVapiCall(callId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<VapiCallLogView>(`/api/ai/vapi/calls/${callId}`)
      .then((response) => response.data);
  },
  getVapiCallLog(callId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<VapiArtifactLogResponse>(`/api/ai/vapi/calls/${callId}/log`)
      .then((response) => response.data);
  },
};
