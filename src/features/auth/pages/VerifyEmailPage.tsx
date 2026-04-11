import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';

export default function VerifyEmailPage() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const onVerify = async () => {
    setLoading(true);
    setStatus('');
    try {
      await authApi.verifyEmail({ token });
      setStatus('auth.verifySuccess');
    } catch {
      setStatus('auth.operationFailed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setLoading(true);
    setStatus('');
    try {
      await authApi.resendVerification(email);
      setStatus('auth.resendSuccess');
    } catch {
      setStatus('auth.operationFailed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Card title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle')}>
          <div className="space-y-4">
            <Input id="verify-token" label={t('auth.token')} value={token} onChange={(e) => setToken(e.target.value)} />
            <Button onClick={onVerify} loading={loading} className="w-full">{t('auth.verifyEmail')}</Button>
            <Input id="verify-email" type="email" label={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={onResend} variant="secondary" loading={loading} className="w-full">{t('auth.resendVerification')}</Button>
            {status && <p className="text-sm text-muted">{t(status)}</p>}
            <Link to="/login" className="text-sm text-muted hover:text-foreground">{t('auth.backToLogin')}</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
