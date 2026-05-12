import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import { authApi } from '@/lib/api/auth-api';
import { passwordRequirementKeys, passwordSchema } from '@/features/auth/utils/password';

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'auth.tokenRequired'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'auth.passwordsMustMatch',
  });

export default function ResetPasswordPage() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const tokenFromQuery = params.get('token') ?? '';
  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validation = useMemo(
    () => resetPasswordSchema.safeParse({ token, newPassword, confirmPassword }),
    [confirmPassword, newPassword, token]
  );

  const fieldError = (field: 'token' | 'newPassword' | 'confirmPassword') => {
    if (validation.success) return '';
    const issue = validation.error.issues.find((item) => item.path[0] === field);
    return issue ? t(issue.message) : '';
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!validation.success) {
      setError(t('auth.validationError'));
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.resetPassword({ token, newPassword });
      setMessage(data.message || t('auth.resetSuccess'));
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError(t('auth.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <Card title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
          <div className="space-y-4">
            <Input id="reset-token" label={t('auth.token')} value={token} onChange={(e) => setToken(e.target.value)} error={fieldError('token')} />
            <Input
              id="reset-password"
              type="password"
              label={t('auth.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={fieldError('newPassword')}
            />
            <Input
              id="confirm-password"
              type="password"
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldError('confirmPassword')}
            />
            <ul className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted">
              {passwordRequirementKeys.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
            {error && <p className="text-sm text-danger">{error}</p>}
            {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}
            <Button type="submit" loading={loading} className="w-full">{t('auth.resetPassword')}</Button>
            {message && <Link to="/login" className="text-sm text-muted hover:text-foreground">{t('auth.backToLogin')}</Link>}
          </div>
        </Card>
      </form>
    </div>
  );
}
