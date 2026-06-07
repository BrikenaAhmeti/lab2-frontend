import i18n from 'i18next';
import Button from '@/ui/atoms/Button';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

const LanguageSwitch = () => {
  const current = i18n.language.slice(0, 2).toLowerCase();

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
          aria-label={`Change language to ${l.label}`}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
export default LanguageSwitch;
