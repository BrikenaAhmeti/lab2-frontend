import Button from '@/ui/atoms/Button';
import SwitchField from '@/ui/molecules/SwitchField';
import { type WorkingHoursRow } from '@/features/settings/workingHours';

interface WorkingHoursEditorProps {
  idPrefix: string;
  rows: WorkingHoursRow[];
  disabled?: boolean;
  onChange: (rows: WorkingHoursRow[]) => void;
}

const defaultStartTime = '08:00';
const defaultEndTime = '18:00';

function presetRows(rows: WorkingHoursRow[], dayMatcher: (day: string) => boolean) {
  return rows.map((row) => ({
    ...row,
    isOpen: dayMatcher(row.day),
    startTime: dayMatcher(row.day) ? defaultStartTime : row.startTime,
    endTime: dayMatcher(row.day) ? defaultEndTime : row.endTime,
  }));
}

export default function WorkingHoursEditor({ idPrefix, rows, disabled, onChange }: WorkingHoursEditorProps) {
  const updateRow = (day: string, values: Partial<WorkingHoursRow>) => {
    onChange(rows.map((row) => (row.day === day ? { ...row, ...values } : row)));
  };

  const setWeekdays = () => {
    onChange(presetRows(rows, (day) => !['saturday', 'sunday'].includes(day)));
  };

  const setEveryDay = () => {
    onChange(presetRows(rows, () => true));
  };

  const clearHours = () => {
    onChange(rows.map((row) => ({ ...row, isOpen: false })));
  };

  return (
    <section className="rounded-lg border border-border bg-surface/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Operating hours</p>
          <p className="mt-1 text-xs leading-5 text-muted">Choose open days and the time window for each day.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={setWeekdays}>
            Weekdays
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={setEveryDay}>
            Every day
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={clearHours}>
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div
            key={row.day}
            className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[minmax(150px,180px)_1fr_1fr] md:items-center"
          >
            <SwitchField
              id={`${idPrefix}-${row.day}-open`}
              label={row.label}
              checked={row.isOpen}
              description={row.isOpen ? 'Open' : 'Closed'}
              disabled={disabled}
              onChange={(checked) => updateRow(row.day, { isOpen: checked })}
              className="border-transparent bg-transparent px-0 py-0 hover:border-transparent"
            />
            <label htmlFor={`${idPrefix}-${row.day}-start`} className="block space-y-1">
              <span className="text-xs font-medium text-muted">Start</span>
              <input
                id={`${idPrefix}-${row.day}-start`}
                type="time"
                value={row.startTime}
                disabled={disabled || !row.isOpen}
                onChange={(event) => updateRow(row.day, { startTime: event.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor={`${idPrefix}-${row.day}-end`} className="block space-y-1">
              <span className="text-xs font-medium text-muted">End</span>
              <input
                id={`${idPrefix}-${row.day}-end`}
                type="time"
                value={row.endTime}
                disabled={disabled || !row.isOpen}
                onChange={(event) => updateRow(row.day, { endTime: event.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
