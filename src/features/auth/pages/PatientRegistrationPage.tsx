import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import PasswordRequirementsList from '@/ui/molecules/PasswordRequirementsList';
import { authApi } from '@/lib/api/auth-api';
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

export default function PatientRegistrationPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      await authApi.register({
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
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`, {
        state: { email: data.email },
      });
    } catch (registrationError) {
      setError(getAuthApiErrorMessage(registrationError, t('auth.registrationFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <Card title={t('auth.patientRegistrationTitle')} subtitle={t('auth.patientRegistrationSubtitle')}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="firstName"
                label={t('auth.firstName')}
                value={values.firstName}
                onChange={(event) => update('firstName', event.target.value)}
                error={fieldError('firstName')}
              />
              <Input
                id="lastName"
                label={t('auth.lastName')}
                value={values.lastName}
                onChange={(event) => update('lastName', event.target.value)}
                error={fieldError('lastName')}
              />
              <Input
                id="register-email"
                type="email"
                label={t('auth.email')}
                value={values.email}
                onChange={(event) => update('email', event.target.value)}
                error={fieldError('email')}
              />
              <Input
                id="username"
                label={t('auth.username')}
                value={values.username}
                onChange={(event) => update('username', event.target.value)}
                error={fieldError('username')}
              />
              <Input
                id="phone"
                label={t('auth.phone')}
                value={values.phone}
                onChange={(event) => update('phone', event.target.value)}
                error={fieldError('phone')}
              />
              <Input
                id="dateOfBirth"
                type="date"
                label={t('auth.dateOfBirth')}
                value={values.dateOfBirth}
                onChange={(event) => update('dateOfBirth', event.target.value)}
                error={fieldError('dateOfBirth')}
              />
              <label className="block space-y-1.5">
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
                onChange={(event) => update('personalNumber', event.target.value)}
                error={fieldError('personalNumber')}
              />
              <Input
                id="register-password"
                type="password"
                label={t('auth.password')}
                value={values.password}
                onChange={(event) => update('password', event.target.value)}
                error={fieldError('password')}
              />
              <Input
                id="register-confirm-password"
                type="password"
                label={t('auth.confirmPassword')}
                value={values.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                error={fieldError('confirmPassword')}
              />
            </div>
            <PasswordRequirementsList items={passwordRequirementKeys.map((key) => t(key))} />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-muted hover:text-foreground">
                {t('auth.alreadyHaveAccount')}
              </Link>
              <Button type="submit" loading={submitting}>
                {t('auth.createPatientAccount')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
