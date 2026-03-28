import i18n from 'i18next';

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

const LanguageSwitch = () => {
  return (
    <div className="flex items-center gap-2">
      {langs.map(l => (
        <button
          key={l.code}
          onClick={() => i18n.changeLanguage(l.code)}
          className="px-2 py-1 border rounded text-sm"
          aria-label={`Change language to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
export default LanguageSwitch;