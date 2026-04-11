import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      await authApi.forgotPassword({ email });
      setStatus('auth.forgotSuccess');
    } catch {
      setStatus('auth.operationFailed');
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
            />
            {status && <p className="text-sm text-muted">{t(status)}</p>}
            <Button type="submit" loading={loading} className="w-full">{t('auth.sendResetLink')}</Button>
            <Link to="/login" className="text-sm text-muted hover:text-foreground">{t('auth.backToLogin')}</Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
