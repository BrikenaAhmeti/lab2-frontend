import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';

export default function VerifyEmailPage() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    if (!token) {
      setError(t('auth.tokenRequired'));
      return;
    }

    const verify = async () => {
      setLoading(true);
      setMessage('');
      setError('');

      try {
        const data = await authApi.verifyEmail({ token });
        setMessage(data.message || t('auth.verifySuccess'));
      } catch {
        setError(t('auth.operationFailed'));
      } finally {
        setLoading(false);
      }
    };

    void verify();
  }, [t, token]);

  const retry = async () => {
    if (!token) {
      setError(t('auth.tokenRequired'));
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const data = await authApi.verifyEmail({ token });
      setMessage(data.message || t('auth.verifySuccess'));
    } catch {
      setError(t('auth.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Card title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle')}>
          <div className="space-y-4">
            {loading && <p className="text-sm text-muted">{t('auth.verifyingEmail')}</p>}
            {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
            {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            {error && token && (
              <Button type="button" onClick={retry} loading={loading} className="w-full">
                {t('auth.tryAgain')}
              </Button>
            )}
            <Link to="/resend-verification" className="block text-sm text-muted hover:text-foreground">{t('auth.resendVerification')}</Link>
            <Link to="/login" className="text-sm text-muted hover:text-foreground">{t('auth.backToLogin')}</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
