import { useTranslation } from 'react-i18next';
import Button from '@/ui/atoms/Button';

const langs = [
  { code: 'en', label: 'EN', nameKey: 'language.english' },
  { code: 'de', label: 'DE', nameKey: 'language.german' },
];

const LanguageSwitch = () => {
  const { i18n, t } = useTranslation('common');
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2).toLowerCase();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      {langs.map(l => (
        <Button
          key={l.code}
          type="button"
          size="sm"
          variant={current === l.code ? 'primary' : 'ghost'}
          onClick={() => i18n.changeLanguage(l.code)}
          className="h-8 px-3 text-xs"
          aria-label={t('language.switchTo', { language: t(l.nameKey) })}
          title={t(l.nameKey)}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
export default LanguageSwitch;
