import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';
import { getAuthApiErrorMessage } from '@/features/auth/utils/errors';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export default function ForgotPasswordPage() {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validation = useMemo(() => forgotPasswordSchema.safeParse({ email }), [email]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!validation.success) {
      setError(t('auth.emailValidationError'));
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setMessage(data.message || t('auth.checkEmailReset'));
    } catch (submitError) {
      setError(getAuthApiErrorMessage(submitError, t('auth.operationFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <Card title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
          <div className="space-y-4">
            <Input
              id="forgot-email"
              type="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              error={error}
            />
            {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
            <Button type="submit" loading={loading} className="w-full">{t('auth.sendResetLink')}</Button>
            <Link to="/login" className="text-sm text-muted hover:text-foreground">{t('auth.backToLogin')}</Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
