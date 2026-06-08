import clsx from 'clsx';
import type { StaffProfileTab } from '@/features/staff/staff.types';

const tabs: Array<{ key: StaffProfileTab; label: string }> = [
  { key: 'info', label: 'Info' },
  { key: 'departments', label: 'Departments' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'exceptions', label: 'Exceptions' },
];

interface StaffTabsProps {
  activeTab: StaffProfileTab;
  onChange: (tab: StaffProfileTab) => void;
}

export default function StaffTabs({ activeTab, onChange }: StaffTabsProps) {
  return (
    <nav className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-background p-1" aria-label="Staff profile tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={clsx(
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            activeTab === tab.key
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted hover:bg-surface hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
