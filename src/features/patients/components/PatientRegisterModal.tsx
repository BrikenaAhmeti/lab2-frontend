import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import BirthdayField from '@/ui/molecules/BirthdayField';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import SelectField from '@/ui/molecules/SelectField';
import TextareaField from '@/ui/molecules/TextareaField';
import { bloodTypeOptions } from './patientFormat';

export type PatientFormValues = Record<
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

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Others' },
];

function validatePatient(values: PatientFormValues) {
  const errors: Partial<Record<keyof PatientFormValues, string>> = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email';
  }

  if (!values.personalNumber.trim()) {
    errors.personalNumber = 'Personal number is required';
  }

  return errors;
}

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
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setValues(emptyValues);
      setLocalError('');
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const fieldErrors = submitted ? validatePatient(values) : {};

  const update = (name: keyof PatientFormValues, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setLocalError('');

    const errors = validatePatient(values);
    if (Object.keys(errors).length > 0) {
      setLocalError('Please complete the required patient details');
      return;
    }

    await onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <form noValidate onSubmit={submit} className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Register patient</h2>
            <p className="mt-1 text-sm text-muted">Personal number is required and checked by the backend for duplicates.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Input
            id="patient-first-name"
            label="First name"
            value={values.firstName}
            required
            onChange={(event) => update('firstName', event.target.value)}
            error={fieldErrors.firstName}
            autoComplete="given-name"
          />
          <Input
            id="patient-last-name"
            label="Last name"
            value={values.lastName}
            required
            onChange={(event) => update('lastName', event.target.value)}
            error={fieldErrors.lastName}
            autoComplete="family-name"
          />
          <Input
            id="patient-email"
            label="Email"
            type="email"
            value={values.email}
            required
            onChange={(event) => update('email', event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />
          <Input
            id="patient-phone"
            label="Phone"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
          />
          <BirthdayField
            id="patient-date-of-birth"
            label="Date of birth"
            value={values.dateOfBirth}
            onChange={(value) => update('dateOfBirth', value)}
            showAge
            autoComplete="bday"
          />
          <SelectField
            id="patient-gender"
            label="Gender"
            value={values.gender}
            onChange={(event) => update('gender', event.target.value)}
          >
            <option value="">Not set</option>
            {genderOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
          <SelectField
            id="patient-blood-type"
            label="Blood type"
            value={values.bloodType}
            onChange={(event) => update('bloodType', event.target.value)}
          >
            <option value="">Not set</option>
            {bloodTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
          <Input
            id="patient-personal-number"
            label="Personal number"
            value={values.personalNumber}
            required
            onChange={(event) => update('personalNumber', event.target.value)}
            error={fieldErrors.personalNumber}
            autoComplete="off"
          />
          <Input id="patient-address" label="Address" value={values.address} onChange={(event) => update('address', event.target.value)} />
          <Input id="patient-emergency-contact" label="Emergency contact" value={values.emergencyContact} onChange={(event) => update('emergencyContact', event.target.value)} />
          <Input id="patient-emergency-phone" label="Emergency phone" value={values.emergencyPhone} onChange={(event) => update('emergencyPhone', event.target.value)} />
          <TextareaField
            id="patient-allergies"
            label="Allergies"
            value={values.allergies}
            rows={3}
            placeholder="List allergies, reactions, or sensitivities"
            onChange={(event) => update('allergies', event.target.value)}
          />
          <Input id="patient-medical-notes" label="Medical notes" value={values.medicalNotes} onChange={(event) => update('medicalNotes', event.target.value)} />
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
