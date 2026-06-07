import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import ResendVerificationForm from '@/features/auth/components/ResendVerificationForm';

export default function ResendVerificationPage() {
  const { t } = useTranslation('common');
  const [params] = useSearchParams();
  const initialEmail = params.get('email') ?? '';

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Card title={t('auth.resendTitle')} subtitle={t('auth.resendSubtitle')}>
          <div className="space-y-4">
            <ResendVerificationForm initialEmail={initialEmail} />
            <Link to="/login" className="text-sm text-muted hover:text-foreground">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
