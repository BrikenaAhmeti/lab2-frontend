import { Download } from 'lucide-react';
import { useId, useState } from 'react';
import Button from '@/ui/atoms/Button';
import {
  downloadFile,
  exchangeFormats,
  getDataExchangeErrorMessage,
  type ExchangeFormat,
  type ExportEntity,
} from '@/lib/api/data-exchange-api';
import { useExportFile } from '@/features/data-exchange/hooks/useDataExchange';

const formatLabels: Record<ExchangeFormat, string> = {
  csv: 'CSV',
  xlsx: 'Excel',
  json: 'JSON',
};

interface ExportButtonProps {
  entity: ExportEntity;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  excludeFields?: string[];
}

export default function ExportButton({ entity, label = 'Export', size = 'sm', excludeFields }: ExportButtonProps) {
  const formatId = useId();
  const [format, setFormat] = useState<ExchangeFormat>('csv');
  const [error, setError] = useState('');
  const exportMutation = useExportFile();

  const handleExport = async () => {
    setError('');

    try {
      const file = await exportMutation.mutateAsync({ entity, format, excludeFields });
      downloadFile(file);
    } catch (exportError) {
      setError(getDataExchangeErrorMessage(exportError, 'Export could not be downloaded'));
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label htmlFor={formatId} className="sr-only">
        Export format
      </label>
      <select
        id={formatId}
        value={format}
        onChange={(event) => setFormat(event.target.value as ExchangeFormat)}
        className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        {exchangeFormats.map((option) => (
          <option key={option} value={option}>
            {formatLabels[option]}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="secondary"
        size={size}
        loading={exportMutation.isPending}
        leftIcon={<Download className="h-4 w-4" />}
        onClick={handleExport}
      >
        {label}
      </Button>
      {error ? <p className="basis-full text-right text-xs text-danger">{error}</p> : null}
    </div>
  );
}
