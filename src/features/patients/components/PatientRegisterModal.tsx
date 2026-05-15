import { useState } from 'react';
import type { FormEvent } from 'react';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { bloodTypeOptions } from './patientFormat';

export type PatientFormValues = Record<
  | 'userId'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'dateOfBirth'
  | 'gender'
  | 'bloodType'
  | 'personalNumber'
  | 'address'
  | 'emergencyContact'
  | 'emergencyPhone'
  | 'allergies'
  | 'medicalNotes',
  string
>;

const emptyValues: PatientFormValues = {
  userId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  personalNumber: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  allergies: '',
  medicalNotes: '',
};

export default function PatientRegisterModal({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: PatientFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<PatientFormValues>(emptyValues);
  const [localError, setLocalError] = useState('');

  if (!open) return null;

  const update = (name: keyof PatientFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    if (!values.firstName.trim() || !values.lastName.trim()) {
      setLocalError('First name and last name are required');
      return;
    }

    await onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <form onSubmit={submit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Register patient</h2>
            <p className="mt-1 text-sm text-muted">Email and personal number are checked by the backend for duplicates.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input label="Linked user ID" value={values.userId} onChange={(event) => update('userId', event.target.value)} />
          <Input label="First name" value={values.firstName} onChange={(event) => update('firstName', event.target.value)} />
          <Input label="Last name" value={values.lastName} onChange={(event) => update('lastName', event.target.value)} />
          <Input label="Email" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} />
          <Input label="Phone" value={values.phone} onChange={(event) => update('phone', event.target.value)} />
          <Input label="Date of birth" type="date" value={values.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} />
          <Input label="Gender" value={values.gender} onChange={(event) => update('gender', event.target.value)} />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Blood type</span>
            <select
              value={values.bloodType}
              onChange={(event) => update('bloodType', event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">Not set</option>
              {bloodTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <Input label="Personal number" value={values.personalNumber} onChange={(event) => update('personalNumber', event.target.value)} />
          <Input label="Address" value={values.address} onChange={(event) => update('address', event.target.value)} />
          <Input label="Emergency contact" value={values.emergencyContact} onChange={(event) => update('emergencyContact', event.target.value)} />
          <Input label="Emergency phone" value={values.emergencyPhone} onChange={(event) => update('emergencyPhone', event.target.value)} />
          <Input label="Allergies" value={values.allergies} onChange={(event) => update('allergies', event.target.value)} />
          <Input label="Medical notes" value={values.medicalNotes} onChange={(event) => update('medicalNotes', event.target.value)} />
        </div>

        <div className="mt-5 space-y-3">
          {localError ? <FeedbackMessage type="error" message={localError} /> : null}
          {error ? <FeedbackMessage type="error" message={error} /> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Register patient</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
