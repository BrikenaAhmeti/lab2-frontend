import { authApi, type PatientRegisterRequest, type VerifyEmailRequest } from '@/lib/api/auth-api';

const registrationIdentityKey = 'medsphere.patientRegistrationIdentity';

interface PatientRegistrationIdentity {
  email: string;
  personalNumber: string;
}

function hasSessionStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePersonalNumber(personalNumber: string | undefined) {
  return personalNumber?.trim() || undefined;
}

export function rememberPatientRegistrationIdentity(identity: PatientRegistrationIdentity) {
  const personalNumber = normalizePersonalNumber(identity.personalNumber);

  if (!hasSessionStorage() || !personalNumber) {
    return;
  }

  window.sessionStorage.setItem(
    registrationIdentityKey,
    JSON.stringify({
      email: normalizeEmail(identity.email),
      personalNumber,
    })
  );
}

export function readPatientRegistrationIdentity(email?: string) {
  if (!hasSessionStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(registrationIdentityKey);
    const stored = raw ? (JSON.parse(raw) as Partial<PatientRegistrationIdentity>) : null;
    const personalNumber = normalizePersonalNumber(stored?.personalNumber);

    if (!stored?.email || !personalNumber) {
      return null;
    }

    const normalizedStoredEmail = normalizeEmail(stored.email);

    if (email && normalizedStoredEmail !== normalizeEmail(email)) {
      return null;
    }

    return {
      email: normalizedStoredEmail,
      personalNumber,
    };
  } catch {
    return null;
  }
}

export function clearPatientRegistrationIdentity(email?: string) {
  if (!hasSessionStorage()) {
    return;
  }

  const stored = readPatientRegistrationIdentity(email);

  if (!email || stored) {
    window.sessionStorage.removeItem(registrationIdentityKey);
  }
}

export function resolveVerificationPersonalNumber(email: string, personalNumber?: string) {
  return normalizePersonalNumber(personalNumber) ?? readPatientRegistrationIdentity(email)?.personalNumber;
}

export const patientRegistrationService = {
  async register(payload: PatientRegisterRequest) {
    const response = await authApi.register(payload);
    rememberPatientRegistrationIdentity({
      email: payload.email,
      personalNumber: payload.personalNumber,
    });
    return response;
  },
  async verifyEmail(payload: VerifyEmailRequest) {
    if ('token' in payload) {
      const response = await authApi.verifyEmail({ token: payload.token });
      clearPatientRegistrationIdentity();
      return response;
    }

    const personalNumber = resolveVerificationPersonalNumber(payload.email, payload.personalNumber);
    const response = await authApi.verifyEmail({
      email: payload.email,
      code: payload.code,
      ...(personalNumber ? { personalNumber } : {}),
    });
    clearPatientRegistrationIdentity(payload.email);
    return response;
  },
};
