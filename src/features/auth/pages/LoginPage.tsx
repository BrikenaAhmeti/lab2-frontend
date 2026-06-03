import { type FormEvent, type InputHTMLAttributes, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import AuthPageShell from '@/features/auth/components/AuthPageShell';
import Button from '@/ui/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';
import type { LoginRequest } from '@/lib/api/auth-api';
import { getAuthApiErrorMessage, isEmailVerificationRequiredError } from '@/features/auth/utils/errors';
import { resolveUserPortalPath } from '@/features/auth/utils/roles';

const emailIdentifierSchema = z.string().trim().email();

const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(8),
});

interface LoginFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}

function LoginField({ id, icon, label, trailing, className, ...props }: LoginFieldProps) {
  return (
    <label htmlFor={id} className="block space-y-2">
      <span className="text-sm font-semibold text-cobalt-950">{label}</span>
      <span className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-white px-3 text-cobalt-950 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.5)] transition focus-within:border-cobalt-500 focus-within:ring-2 focus-within:ring-cobalt-500/15">
        <span className="text-cobalt-900/55">{icon}</span>
        <input
          id={id}
          className={`min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-cobalt-950/35 ${className ?? ''}`.trim()}
          {...props}
        />
        {trailing}
      </span>
    </label>
  );
}

function createLoginRequest(identifier: string, password: string): LoginRequest {
  const credential = identifier.trim();
  return emailIdentifierSchema.safeParse(credential).success
    ? { email: credential, password }
    : { username: credential, password };
}

export default function LoginPage() {
  const { t } = useTranslation('common');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const hasVerifiedEmail = searchParams.get('verified') === '1' || searchParams.get('verified') === 'true';

  const validation = useMemo(
    () => loginSchema.safeParse({ identifier, password }),
    [identifier, password]
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validation.success) {
      setErrorMessage(t('auth.validationError'));
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const user = await login(createLoginRequest(identifier, password));
      navigate(resolveUserPortalPath(user), { replace: true });
    } catch (error) {
      if (isEmailVerificationRequiredError(error)) {
        setErrorMessage(t('auth.verifyEmailLinkBeforeLogin'));
      } else {
        setErrorMessage(getAuthApiErrorMessage(error, t('auth.loginFailed')));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      compact
      eyebrow={t('auth.portalAccess')}
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {hasVerifiedEmail ? (
          <p className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2.5 text-sm font-medium text-success">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t('auth.emailVerifiedCanLogin')}
          </p>
        ) : null}

        <div className="space-y-4">
          <LoginField
            id="email"
            type="text"
            label={t('auth.loginIdentifier')}
            icon={<Mail size={18} aria-hidden="true" />}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t('auth.loginIdentifierPlaceholder')}
            autoComplete="username"
          />
          <LoginField
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t('auth.password')}
            icon={<LockKeyhole size={18} aria-hidden="true" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                className="rounded-lg p-1 text-cobalt-950/45 transition hover:bg-cobalt-50 hover:text-cobalt-700"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            }
          />
        </div>

        {errorMessage ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{errorMessage}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label htmlFor="remember-me" className="inline-flex items-center gap-2 font-medium text-cobalt-950/70">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-border text-cobalt-600 focus:ring-cobalt-500/30"
            />
            {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" className="font-semibold text-cobalt-600 transition hover:text-cobalt-800">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          loading={submitting}
          rightIcon={<ArrowRight size={16} />}
          className="min-h-12 w-full bg-cobalt-600 text-white shadow-[0_18px_32px_-22px_rgba(37,99,235,0.85)] hover:bg-cobalt-700"
        >
          {t('auth.signIn')}
        </Button>

        <div className="rounded-lg border border-cobalt-100 bg-cobalt-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-cobalt-600 shadow-soft">
                <UserPlus size={23} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-cobalt-950">{t('auth.newPatientQuestion')}</p>
                <p className="mt-1 text-sm leading-5 text-cobalt-950/62">{t('auth.newPatientSubtitle')}</p>
              </div>
            </div>
            <Link
              to="/register"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:bg-cobalt-700"
            >
              {t('auth.registerAsPatient')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </form>
    </AuthPageShell>
  );
}
