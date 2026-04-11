import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';

export default function ResetPasswordPage() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const tokenFromQuery = params.get('token') ?? '';
  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      await authApi.resetPassword({ token, password });
      setStatus('auth.resetSuccess');
    } catch {
      setStatus('auth.operationFailed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <Card title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
          <div className="space-y-4">
            <Input id="reset-token" label={t('auth.token')} value={token} onChange={(e) => setToken(e.target.value)} />
            <Input id="reset-password" type="password" label={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} />
            {status && <p className="text-sm text-muted">{t(status)}</p>}
            <Button type="submit" loading={loading} className="w-full">{t('auth.resetPassword')}</Button>
            <Link to="/login" className="text-sm text-muted hover:text-foreground">{t('auth.backToLogin')}</Link>
          </div>
        </Card>
      </form>
    </div>
  );
}
