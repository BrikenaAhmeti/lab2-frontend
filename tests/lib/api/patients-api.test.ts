import { describe, expect, it } from 'vitest';
import { normalizePatientRecordResponse } from '@/lib/api/patients-api';

describe('patients API normalization', () => {
  const patient = {
    id: 'patient-1',
    firstName: 'Arta',
    lastName: 'Krasniqi',
  };

  it('accepts direct patient records and common backend envelopes', () => {
    expect(normalizePatientRecordResponse(patient)).toBe(patient);
    expect(normalizePatientRecordResponse({ patient })).toBe(patient);
    expect(normalizePatientRecordResponse({ data: patient })).toBe(patient);
    expect(normalizePatientRecordResponse({ data: { patient } })).toBe(patient);
  });

  it('fails clearly when the backend response has no patient id', () => {
    expect(() => normalizePatientRecordResponse({ data: {} })).toThrow('Patient profile response did not include a patient id');
  });
});
