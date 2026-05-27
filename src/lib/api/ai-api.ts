import type { AxiosInstance } from 'axios';
import { aiApiClient } from './axios';

export interface LabInterpretationView {
  labOrderId: string;
  patientVersion: string;
  clinicalVersion?: string | null;
  disclaimer?: string | null;
  recommendations?: string[];
  riskFlags?: string[];
  generatedAt?: string | null;
}

type LabInterpretationEnvelope = {
  data?: LabInterpretationView;
  interpretation?: LabInterpretationView;
};

function client(instance?: AxiosInstance) {
  return instance ?? aiApiClient;
}

function unwrapLabInterpretation(value: LabInterpretationView | LabInterpretationEnvelope) {
  return 'patientVersion' in value ? value : value.data ?? value.interpretation ?? (value as LabInterpretationView);
}

export const aiApi = {
  getLabInterpretation(labOrderId: string, instance?: AxiosInstance) {
    return client(instance)
      .get<LabInterpretationView | LabInterpretationEnvelope>(`/api/ai/lab-results/${labOrderId}/interpretation`)
      .then((response) => unwrapLabInterpretation(response.data));
  },
};
