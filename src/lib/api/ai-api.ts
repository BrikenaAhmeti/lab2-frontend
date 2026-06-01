import { isAxiosError, type AxiosInstance } from 'axios';
import { aiApiClient } from './axios';

export interface LabInterpretationView {
  labOrderId: string;
  patientVersion?: string | null;
  clinicalVersion?: string | null;
  disclaimer?: string | null;
  recommendations?: string[];
  riskFlags?: string[];
  generatedAt?: string | null;
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
};
