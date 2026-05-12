import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';

const resendSchema = z.object({
  email: z.string().email(),
});

export default function ResendVerificationPage() {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validation = useMemo(() => resendSchema.safeParse({ email }), [email]);

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
      const data = await authApi.resendVerification({ email });
      setMessage(data.message || t('auth.checkEmailVerification'));
    } catch {
      setError(t('auth.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <Card title={t('auth.resendTitle')} subtitle={t('auth.resendSubtitle')}>
          <div className="space-y-4">
            <Input
              id="resend-email"
              type="email"
              label={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              error={error}
            />
            {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
            <Button type="submit" loading={loading} className="w-full">
              {t('auth.resendVerification')}
            </Button>
            <Link to="/login" className="text-sm text-muted hover:text-foreground">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
