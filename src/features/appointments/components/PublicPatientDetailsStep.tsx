import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { PublicAppointmentPatientPayload } from '@/lib/api/appointments-api';

export type PublicPatientDetails = PublicAppointmentPatientPayload;

export type PublicPatientDetailsField = keyof PublicPatientDetails;

export const emptyPublicPatientDetails: PublicPatientDetails = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  personalNumber: '',
  dateOfBirth: '',
  gender: '',
};

interface PublicPatientDetailsStepProps {
  details: PublicPatientDetails;
  submitted: boolean;
  onChange: (field: PublicPatientDetailsField, value: string) => void;
}

const requiredMessages: Record<PublicPatientDetailsField, string> = {
  firstName: 'First name is required.',
  lastName: 'Last name is required.',
  email: 'Email is required.',
  phone: 'Phone number is required.',
  personalNumber: 'Personal number is required.',
  dateOfBirth: 'Date of birth is required.',
  gender: 'Gender is required.',
};

export function validatePublicPatientDetails(details: PublicPatientDetails) {
  const errors: Partial<Record<PublicPatientDetailsField, string>> = {};
  const phoneDigits = details.phone.replace(/\D/g, '');
  const birthDate = details.dateOfBirth.trim() ? new Date(`${details.dateOfBirth.trim()}T00:00:00`) : null;

  (Object.keys(requiredMessages) as PublicPatientDetailsField[]).forEach((field) => {
    if (!details[field].trim()) {
      errors[field] = requiredMessages[field];
    }
  });

  if (details.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (details.phone.trim() && phoneDigits.length < 7) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (details.personalNumber.trim() && details.personalNumber.replace(/\D/g, '').length < 5) {
    errors.personalNumber = 'Enter a valid personal number.';
  }

  if (details.dateOfBirth.trim()) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      errors.dateOfBirth = 'Enter a valid date of birth.';
    } else if (birthDate > today) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.';
    }
  }

  if (details.gender.trim() && !['female', 'male', 'other'].includes(details.gender.trim())) {
    errors.gender = 'Select a valid gender option.';
  }

  return errors;
}

export function normalizePublicPatientDetails(details: PublicPatientDetails): PublicPatientDetails {
  return {
    firstName: details.firstName.trim(),
    lastName: details.lastName.trim(),
    email: details.email.trim(),
    phone: details.phone.trim(),
    personalNumber: details.personalNumber.trim(),
    dateOfBirth: details.dateOfBirth.trim(),
    gender: details.gender.trim(),
  };
}

export default function PublicPatientDetailsStep({
  details,
  submitted,
  onChange,
}: PublicPatientDetailsStepProps) {
  const errors = submitted ? validatePublicPatientDetails(details) : {};

  return (
    <div className="space-y-4">
      {submitted && Object.keys(errors).length > 0 ? (
        <FeedbackMessage type="error" message="Please complete the required patient details before confirming the appointment." />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id="public-first-name"
          label="First name"
          value={details.firstName}
          onChange={(event) => onChange('firstName', event.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Input
          id="public-last-name"
          label="Last name"
          value={details.lastName}
          onChange={(event) => onChange('lastName', event.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
        <Input
          id="public-email"
          type="email"
          label="Email"
          value={details.email}
          onChange={(event) => onChange('email', event.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          id="public-phone"
          type="tel"
          label="Phone number"
          value={details.phone}
          onChange={(event) => onChange('phone', event.target.value)}
          error={errors.phone}
          autoComplete="tel"
        />
        <Input
          id="public-personal-number"
          label="Personal number"
          value={details.personalNumber}
          onChange={(event) => onChange('personalNumber', event.target.value)}
          error={errors.personalNumber}
          autoComplete="off"
        />
        <Input
          id="public-date-of-birth"
          type="date"
          label="Date of birth"
          value={details.dateOfBirth}
          onChange={(event) => onChange('dateOfBirth', event.target.value)}
          error={errors.dateOfBirth}
          autoComplete="bday"
        />
        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Gender</span>
          <select
            id="public-gender"
            value={details.gender}
            onChange={(event) => onChange('gender', event.target.value)}
            className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              errors.gender ? 'border-danger focus:border-danger focus:ring-danger/20' : 'border-border'
            }`}
          >
            <option value="">Select gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          {errors.gender ? <p className="text-xs text-danger">{errors.gender}</p> : null}
        </label>
      </div>
    </div>
  );
}
