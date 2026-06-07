import type { PatientRecord } from '@/lib/api/patients-api';
import { formatBloodType, formatDate, formatEnum, formatJsonText } from './patientFormat';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value || '-'}</p>
    </div>
  );
}

export function PersonalPanel({ patient, selfView }: { patient: PatientRecord; selfView?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Field label="First name" value={patient.firstName} />
      <Field label="Last name" value={patient.lastName} />
      <Field label="Email" value={patient.email} />
      <Field label="Phone" value={patient.phone} />
      <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
      <Field label="Gender" value={formatEnum(patient.gender)} />
      <Field label="Personal number" value={selfView ? null : patient.personalNumber} />
      <Field label="Address" value={patient.address} />
      <Field label="Emergency contact" value={patient.emergencyContact} />
      <Field label="Emergency phone" value={patient.emergencyPhone} />
    </div>
  );
}

export function MedicalPanel({ patient }: { patient: PatientRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Blood type" value={formatBloodType(patient.bloodType)} />
      <Field label="Allergies" value={formatJsonText(patient.allergies)} />
      <Field label="Medical notes" value={formatJsonText(patient.medicalNotes)} />
    </div>
  );
}

export function EmptyTabPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-muted">{text}</p>
    </div>
  );
}
