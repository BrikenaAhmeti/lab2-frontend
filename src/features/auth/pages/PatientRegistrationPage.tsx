import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, LogIn, MailCheck, ShieldCheck } from 'lucide-react';
import AuthPageShell from '@/features/auth/components/AuthPageShell';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import BirthdayField from '@/ui/molecules/BirthdayField';
import PasswordRequirementsList from '@/ui/molecules/PasswordRequirementsList';
import { patientRegistrationService } from '@/features/auth/services/patientRegistrationService';
import { getAuthApiErrorMessage } from '@/features/auth/utils/errors';
import { passwordRequirementKeys, passwordSchema } from '@/features/auth/utils/password';

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  personalNumber: '',
  password: '',
  confirmPassword: '',
};

type PatientRegistrationField = keyof typeof initialValues;
const publicBookingRegistrationKey = 'medsphere.publicBookingPatient';
const appointmentPrefillFields: PatientRegistrationField[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'gender',
  'personalNumber',
];

const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1, 'auth.firstNameRequired'),
    lastName: z.string().trim().min(1, 'auth.lastNameRequired'),
    email: z.string().trim().email('auth.emailValidationError'),
    username: z.string().trim(),
    phone: z.string().trim(),
    dateOfBirth: z.string().trim(),
    gender: z.string().trim(),
    personalNumber: z.string().trim().min(1, 'auth.personalNumberRequired'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.passwordsMustMatch',
  });

function optionalText(value: string) {
  return value.trim() || undefined;
}

function readAppointmentRegistrationDefaults(searchParams: URLSearchParams) {
  if (searchParams.get('source') !== 'appointment') {
    return initialValues;
  }

  let stored: Record<string, unknown> = {};

  try {
    const raw = window.sessionStorage.getItem(publicBookingRegistrationKey);
    stored = raw ? JSON.parse(raw) : {};
  } catch {
    stored = {};
  }

  return appointmentPrefillFields.reduce(
    (next, field) => ({
      ...next,
      [field]: typeof stored[field] === 'string' ? stored[field] : next[field],
    }),
    { ...initialValues }
  );
}

export default function PatientRegistrationPage() {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(() => readAppointmentRegistrationDefaults(searchParams));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [error, setError] = useState('');

  const validation = useMemo(() => registrationSchema.safeParse(values), [values]);

  const update = (field: PatientRegistrationField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const fieldError = (field: PatientRegistrationField) => {
    if (!submitted || validation.success) return '';
    const issue = validation.error.issues.find((item) => item.path[0] === field);
    return issue ? t(issue.message) : '';
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setError('');

    if (!validation.success) {
      setError(t('auth.fixFormErrors'));
      return;
    }

    setSubmitting(true);

    try {
      const data = validation.data;
      await patientRegistrationService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        personalNumber: data.personalNumber,
        username: optionalText(data.username),
        phone: optionalText(data.phone),
        dateOfBirth: optionalText(data.dateOfBirth),
        gender: optionalText(data.gender),
      });
      window.sessionStorage.removeItem(publicBookingRegistrationKey);
      setRegisteredEmail(data.email);
    } catch (registrationError) {
      setError(getAuthApiErrorMessage(registrationError, t('auth.registrationFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow={t('auth.patientRegistrationEyebrow')}
      title={t('auth.patientRegistrationTitle')}
      subtitle={t('auth.patientRegistrationSubtitle')}
    >
      {registeredEmail ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-success/25 bg-success/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-success shadow-soft">
                <MailCheck size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-bold text-cobalt-950">{t('auth.registrationCheckEmailLinkTitle')}</p>
                <p className="mt-2 text-sm leading-6 text-cobalt-950/68">{t('auth.registrationCheckEmailLink')}</p>
                <p className="mt-3 rounded-lg border border-success/20 bg-white px-3 py-2 text-sm font-semibold text-success">
                  {registeredEmail}
                </p>
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-cobalt-700"
          >
            <LogIn size={16} aria-hidden="true" />
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            t('auth.registrationStepProfile'),
            t('auth.registrationStepSecurity'),
            t('auth.registrationStepVerify'),
          ].map((step, index) => (
            <div key={step} className="rounded-lg border border-border bg-surface/50 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{step}</p>
              </div>
            </div>
          ))}
        </div>

        {searchParams.get('source') === 'appointment' ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{t('auth.appointmentPrefillNotice')}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="firstName"
            label={t('auth.firstName')}
            value={values.firstName}
            onChange={(event) => update('firstName', event.target.value)}
            autoComplete="given-name"
            error={fieldError('firstName')}
          />
          <Input
            id="lastName"
            label={t('auth.lastName')}
            value={values.lastName}
            onChange={(event) => update('lastName', event.target.value)}
            autoComplete="family-name"
            error={fieldError('lastName')}
          />
          <Input
            id="register-email"
            type="email"
            label={t('auth.email')}
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            autoComplete="email"
            error={fieldError('email')}
          />
          <Input
            id="username"
            label={t('auth.username')}
            value={values.username}
            onChange={(event) => update('username', event.target.value)}
            autoComplete="username"
            error={fieldError('username')}
          />
          <Input
            id="phone"
            label={t('auth.phone')}
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
            error={fieldError('phone')}
          />
          <BirthdayField
            id="dateOfBirth"
            label={t('auth.dateOfBirth')}
            value={values.dateOfBirth}
            onChange={(value) => update('dateOfBirth', value)}
            autoComplete="bday"
            error={fieldError('dateOfBirth')}
          />
          <label htmlFor="gender" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">{t('auth.gender')}</span>
            <select
              id="gender"
              value={values.gender}
              onChange={(event) => update('gender', event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('auth.selectGender')}</option>
              <option value="female">{t('auth.genderFemale')}</option>
              <option value="male">{t('auth.genderMale')}</option>
              <option value="other">{t('auth.genderOther')}</option>
            </select>
            {fieldError('gender') ? <p className="text-xs text-danger">{fieldError('gender')}</p> : null}
          </label>
          <Input
            id="personalNumber"
            label={t('auth.personalNumber')}
            value={values.personalNumber}
            required
            onChange={(event) => update('personalNumber', event.target.value)}
            autoComplete="off"
            error={fieldError('personalNumber')}
          />
          <Input
            id="register-password"
            type="password"
            label={t('auth.password')}
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            autoComplete="new-password"
            error={fieldError('password')}
          />
          <Input
            id="register-confirm-password"
            type="password"
            label={t('auth.confirmPassword')}
            value={values.confirmPassword}
            onChange={(event) => update('confirmPassword', event.target.value)}
            autoComplete="new-password"
            error={fieldError('confirmPassword')}
          />
        </div>

        <div className="rounded-lg border border-border bg-surface/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck size={17} className="text-success" aria-hidden="true" />
            {t('auth.passwordRulesTitle')}
          </div>
          <PasswordRequirementsList items={passwordRequirementKeys.map((key) => t(key))} />
        </div>

        {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm font-medium text-muted transition hover:border-primary/35 hover:text-foreground"
          >
            <LogIn size={15} aria-hidden="true" />
            {t('auth.alreadyHaveAccount')}
          </Link>
          <Button type="submit" loading={submitting} rightIcon={<ArrowRight size={16} />}>
            {t('auth.registerAsPatient')}
          </Button>
        </div>
      </form>
      )}
    </AuthPageShell>
  );
}
