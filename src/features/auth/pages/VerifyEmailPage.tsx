import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';
import ResendVerificationForm from '@/features/auth/components/ResendVerificationForm';
import { getAuthApiErrorMessage } from '@/features/auth/utils/errors';

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState('');
  const verifiedTokenRef = useRef<string | null>(null);

  const verifyToken = useCallback(async () => {
    if (!token) {
      setStatus('error');
      setError(t('auth.tokenRequired'));
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await authApi.verifyEmail({ token });
      setStatus('success');
    } catch (verifyError) {
      setStatus('error');
      setError(getAuthApiErrorMessage(verifyError, t('auth.verifyInvalidOrExpired')));
    }
  }, [t, token]);

  useEffect(() => {
    if (verifiedTokenRef.current === token) return;
    verifiedTokenRef.current = token;
    void verifyToken();
  }, [token, verifyToken]);

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Card title={t('auth.verifyTitle')} subtitle={t('auth.verifySubtitle')}>
          <div className="space-y-4">
            {status === 'loading' && <p className="text-sm text-muted">{t('auth.verifyingEmail')}</p>}
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
            ) : null}
            {status === 'error' ? (
              <>
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
                {token ? (
                  <Button type="button" onClick={verifyToken} className="w-full">
                    {t('auth.tryAgain')}
                  </Button>
                ) : null}
                <div className="rounded-xl border border-border bg-surface/60 p-4">
                  <ResendVerificationForm initialEmail={email} />
                </div>
              </>
            ) : null}
            {status !== 'success' ? (
              <Link to="/login" className="text-sm text-muted hover:text-foreground">
                {t('auth.backToLogin')}
              </Link>
            ) : null}
            {status === 'idle' ? <p className="text-sm text-muted">{t('loading')}</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
