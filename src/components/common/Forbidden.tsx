import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '@/ui/atoms/Button';

export default function Forbidden() {
  const { t } = useTranslation('common');

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="panel max-w-md p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">403</p>
        <h2 className="mt-2 text-2xl font-semibold">{t('auth.forbiddenTitle')}</h2>
        <p className="mt-2 text-sm text-muted">{t('auth.forbiddenDescription')}</p>
        <Link to="/role-redirect" className="mt-5 inline-block">
          <Button>{t('auth.backToDashboard')}</Button>
        </Link>
      </div>
    </div>
  );
}
