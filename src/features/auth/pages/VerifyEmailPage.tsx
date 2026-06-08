import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import ResendVerificationForm from '@/features/auth/components/ResendVerificationForm';
import { getAuthApiErrorMessage } from '@/features/auth/utils/errors';
import {
  patientRegistrationService,
  resolveVerificationPersonalNumber,
} from '@/features/auth/services/patientRegistrationService';

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

const verificationSchema = z.object({
  email: z.string().trim().email('auth.emailValidationError'),
  code: z.string().trim().regex(/^\d{6}$/, 'auth.codeValidationError'),
});

interface VerifyEmailLocationState {
  email?: string;
  personalNumber?: string;
}

export default function VerifyEmailPage() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const locationState = location.state as VerifyEmailLocationState | null;
  const stateEmail = locationState?.email ?? '';
  const initialEmail = stateEmail || params.get('email') || '';
  const initialPersonalNumber =
    locationState?.personalNumber ?? (initialEmail ? resolveVerificationPersonalNumber(initialEmail) : '') ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'idle');
  const [error, setError] = useState('');
  const verifyErrorFallback = t('auth.verifyInvalidOrExpired');

  const validation = useMemo(() => verificationSchema.safeParse({ email, code }), [email, code]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    setStatus('loading');
    setError('');

    patientRegistrationService
      .verifyEmail({ token })
      .then(() => {
        if (active) {
          navigate('/login?verified=1', { replace: true, state: { verified: true } });
        }
      })
      .catch((verifyError) => {
        if (active) {
          setStatus('error');
          setError(getAuthApiErrorMessage(verifyError, verifyErrorFallback));
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, token, verifyErrorFallback]);

  const fieldError = (field: 'email' | 'code') => {
    if (!submitted || validation.success) return '';
    const issue = validation.error.issues.find((item) => item.path[0] === field);
    return issue ? t(issue.message) : '';
  };

  const updateCode = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setError('');

    if (!validation.success) {
      setStatus('error');
      setError(t('auth.fixFormErrors'));
      return;
    }

    setStatus('loading');

    try {
      await patientRegistrationService.verifyEmail({
        ...validation.data,
        ...(initialPersonalNumber ? { personalNumber: initialPersonalNumber } : {}),
      });
      setStatus('success');
    } catch (verifyError) {
      setStatus('error');
      setError(getAuthApiErrorMessage(verifyError, t('auth.verifyInvalidOrExpired')));
    }
  };

  if (token) {
    return (
      <AuthPageShell
        compact
        eyebrow={t('auth.portalAccess')}
        title={t('auth.verifyTitle')}
        subtitle={t('auth.verifyLinkSubtitle')}
      >
        <div className="space-y-4">
          {status === 'error' ? (
            <>
              <p className="rounded-lg border border-danger/15 bg-danger/10 px-3 py-2.5 text-sm text-danger">
                {error || t('auth.verifyLinkFailed')}
              </p>
              <Link to="/login" className="block">
                <Button type="button" className="w-full">
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </>
          ) : (
            <div className="rounded-lg border border-cobalt-100 bg-cobalt-50/80 p-5 text-center">
              <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-cobalt-600 border-t-transparent" />
              <p className="mt-4 text-sm font-semibold text-cobalt-950">{t('auth.verifyingEmailLink')}</p>
            </div>
          )}
        </div>
      </AuthPageShell>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Card title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle')}>
          <div className="space-y-4">
            {status === 'success' ? (
              <>
                <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                  {t('auth.emailVerifiedCanLogin')}
                </p>
                <Link to="/login" className="block">
                  <Button type="button" className="w-full">
                    {t('auth.backToLogin')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {initialEmail ? (
                  <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                    {t('auth.registrationSuccessVerify')}
                  </p>
                ) : null}
                <form onSubmit={onSubmit} className="space-y-4">
                  {initialEmail ? null : (
                    <Input
                      id="verify-email-address"
                      type="email"
                      label={t('auth.email')}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="patient@example.com"
                      autoComplete="email"
                      error={fieldError('email')}
                    />
                  )}
                  <Input
                    id="verification-code"
                    label={t('auth.verificationCode')}
                    value={code}
                    onChange={(event) => updateCode(event.target.value)}
                    placeholder="000000"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    error={fieldError('code')}
                  />
                  {error && !fieldError('email') && !fieldError('code') ? (
                    <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
                  ) : null}
                  <Button type="submit" loading={status === 'loading'} className="w-full">
                    {t('auth.verifyCode')}
                  </Button>
                </form>
                <div className="rounded-xl border border-border bg-surface/60 p-4">
                  <ResendVerificationForm initialEmail={email} />
                </div>
              </>
            )}
            {status !== 'success' ? (
              <Link to="/login" className="text-sm text-muted hover:text-foreground">
                {t('auth.backToLogin')}
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
