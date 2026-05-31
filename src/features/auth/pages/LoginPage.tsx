import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
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

  const [identifier, setIdentifier] = useState('admin@example.com');
  const [password, setPassword] = useState('UserPassword123!');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
        const emailResult = emailIdentifierSchema.safeParse(identifier);
        const verifiedEmail = emailResult.success ? emailResult.data : '';
        navigate(
          verifiedEmail ? `/verify-email?email=${encodeURIComponent(verifiedEmail)}` : '/verify-email',
          {
            state: verifiedEmail ? { email: verifiedEmail } : undefined,
          }
        );
      } else {
        setErrorMessage(getAuthApiErrorMessage(error, t('auth.loginFailed')));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <Card title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
          <div className="space-y-4">
            <Input
              id="email"
              type="text"
              label={t('auth.loginIdentifier')}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="user@example.com or username"
              autoComplete="username"
            />
            <Input
              id="password"
              type="password"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
            {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}
            <Button type="submit" loading={submitting} className="w-full">
              {t('auth.signIn')}
            </Button>
            <div className="flex items-center justify-between text-sm text-muted">
              <Link to="/forgot-password" className="hover:text-foreground">{t('auth.forgotPassword')}</Link>
              <Link to="/verify-email" className="hover:text-foreground">{t('auth.verifyEmail')}</Link>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
