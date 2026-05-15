import clsx from 'clsx';

export type PatientProfileTab = 'personal' | 'medical' | 'history' | 'documents' | 'appointments' | 'billing';

const tabs: { id: PatientProfileTab; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'medical', label: 'Medical' },
  { id: 'history', label: 'History Timeline' },
  { id: 'documents', label: 'Documents' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'billing', label: 'Billing' },
];

export default function PatientTabs({
  activeTab,
  onChange,
}: {
  activeTab: PatientProfileTab;
  onChange: (tab: PatientProfileTab) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition',
            activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted hover:bg-surface hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
