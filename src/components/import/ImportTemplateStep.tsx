import Button from '@/ui/atoms/Button';
import { exchangeFormats, type ExchangeFormat } from '@/lib/api/data-exchange-api';
import { formatLabels } from './importOptions';

interface ImportTemplateStepProps {
  formatId: string;
  format: ExchangeFormat;
  loading: boolean;
  onFormatChange: (format: ExchangeFormat) => void;
  onDownload: () => void;
}

export default function ImportTemplateStep({
  formatId,
  format,
  loading,
  onFormatChange,
  onDownload,
}: ImportTemplateStepProps) {
  return (
    <section className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground">Template</h3>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label htmlFor={formatId} className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Format</span>
          <select
            id={formatId}
            value={format}
            onChange={(event) => onFormatChange(event.target.value as ExchangeFormat)}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            {exchangeFormats.map((option) => (
              <option key={option} value={option}>
                {formatLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" variant="secondary" loading={loading} onClick={onDownload}>
          Download Template
        </Button>
      </div>
    </section>
  );
}
