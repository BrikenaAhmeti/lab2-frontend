import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';

const roleRedirectPriority = [
  { role: 'Super Admin', to: '/admin' },
  { role: 'Admin', to: '/admin' },
  { role: 'Doctor', to: '/doctor' },
  { role: 'Nurse', to: '/nurse' },
  { role: 'Lab Technician', to: '/lab' },
  { role: 'Pharmacist', to: '/pharmacy' },
  { role: 'Receptionist', to: '/receptionist' },
  { role: 'Patient', to: '/patient' },
] as const;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function resolveRedirect(roles: string[]) {
  const hit = roleRedirectPriority.find((item) => roles.includes(item.role));
  return hit?.to ?? '/admin';
}

export default function LoginPage() {
  const { t } = useTranslation('common');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectFromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('UserPassword123!');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState('');

  const validation = useMemo(() => loginSchema.safeParse({ email, password }), [email, password]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validation.success) {
      setErrorKey('auth.validationError');
      return;
    }

    setSubmitting(true);
    setErrorKey('');

    try {
      const user = await login({ email, password });

      const destination = redirectFromState && redirectFromState !== '/login'
        ? redirectFromState
        : resolveRedirect(user.roles);

      navigate(destination, { replace: true });
    } catch {
      setErrorKey('auth.loginFailed');
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
              type="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <Input
              id="password"
              type="password"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
            {errorKey && <p className="text-sm text-danger">{t(errorKey)}</p>}
            <Button type="submit" loading={submitting} className="w-full">
              {t('auth.signIn')}
            </Button>
            <div className="flex items-center justify-between text-sm text-muted">
              <Link to="/forgot-password" className="hover:text-foreground">{t('auth.forgotPassword')}</Link>
              <Link to="/resend-verification" className="hover:text-foreground">{t('auth.verifyEmail')}</Link>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
