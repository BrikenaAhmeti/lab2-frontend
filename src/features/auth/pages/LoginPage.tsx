import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';
import { useAppDispatch } from '@/app/hooks';
import { setSession } from '@/features/auth/authSlice';
import { persistSession } from '@/features/auth/useAuthBootstrap';

const roleRedirectPriority = [
  { role: 'Super Admin', to: '/dashboard/users' },
  { role: 'Admin', to: '/dashboard/users' },
  { role: 'Doctor', to: '/dashboard/doctor' },
  { role: 'Nurse', to: '/dashboard/nurse' },
  { role: 'Lab Technician', to: '/dashboard/lab' },
  { role: 'Pharmacist', to: '/dashboard/pharmacy' },
  { role: 'Receptionist', to: '/dashboard/reception' },
  { role: 'Patient', to: '/dashboard/patient' },
] as const;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function resolveRedirect(roles: string[]) {
  const hit = roleRedirectPriority.find((item) => roles.includes(item.role));
  return hit?.to ?? '/dashboard';
}

export default function LoginPage() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
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
      const data = await authApi.login({ email, password });
      dispatch(setSession(data));
      persistSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });

      const destination = redirectFromState && redirectFromState.startsWith('/dashboard')
        ? redirectFromState
        : resolveRedirect(data.user.roles);

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
              <Link to="/verify-email" className="hover:text-foreground">{t('auth.verifyEmail')}</Link>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
