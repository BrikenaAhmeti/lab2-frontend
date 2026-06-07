import { importModes, type ImportMode } from '@/lib/api/data-exchange-api';
import { modeLabels } from './importOptions';

interface ImportModePickerProps {
  mode: ImportMode;
  onChange: (mode: ImportMode) => void;
}

export default function ImportModePicker({ mode, onChange }: ImportModePickerProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">Import Mode</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {importModes.map((option) => (
          <label key={option} className="rounded-xl border border-border bg-background p-3 text-sm text-foreground">
            <span className="flex items-center gap-2 font-medium">
              <input
                type="radio"
                name="import-mode"
                value={option}
                checked={mode === option}
                onChange={() => onChange(option)}
                className="h-4 w-4 border-border"
              />
              {modeLabels[option]}
            </span>
            <span className="mt-1 block text-xs text-muted">
              {option === 'strict' ? 'Stop the import if any row has an error.' : 'Import valid rows and report skipped rows.'}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
