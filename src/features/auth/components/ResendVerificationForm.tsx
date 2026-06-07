import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import { authApi } from '@/lib/api/auth-api';
import { getAuthApiErrorMessage } from '@/features/auth/utils/errors';

const resendSchema = z.object({
  email: z.string().trim().email('auth.emailValidationError'),
});

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export default function ResendVerificationForm({ initialEmail = '' }: ResendVerificationFormProps) {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const validation = useMemo(() => resendSchema.safeParse({ email }), [email]);

  const emailError = () => {
    if (validation.success || !error) return '';
    const issue = validation.error.issues.find((item) => item.path[0] === 'email');
    return issue ? t(issue.message) : '';
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!validation.success) {
      setError(t('auth.emailValidationError'));
      return;
    }

    setLoading(true);

    try {
      await authApi.resendVerification({ email });
      setMessage(t('auth.checkEmailVerification'));
    } catch (submitError) {
      setError(getAuthApiErrorMessage(submitError, t('auth.operationFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        id="resend-email"
        type="email"
        label={t('auth.email')}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="patient@example.com"
        error={emailError()}
      />
      {error && !emailError() ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p> : null}
      <Button type="submit" loading={loading} className="w-full">
        {t('auth.resendVerification')}
      </Button>
    </form>
  );
}
