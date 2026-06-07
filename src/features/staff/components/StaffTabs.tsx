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
    <nav className="flex flex-wrap gap-2" aria-label="Staff profile tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={clsx(
            'rounded-lg border px-3 py-2 text-sm font-medium transition',
            activeTab === tab.key
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted hover:bg-surface hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
