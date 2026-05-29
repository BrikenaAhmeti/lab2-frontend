import { Upload } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  downloadFile,
  getDataExchangeErrorMessage,
  type ExchangeFormat,
  type ImportEntity,
  type ImportMode,
  type ImportResult,
} from '@/lib/api/data-exchange-api';
import {
  useImportFile,
  useImportJob,
  useImportTemplate,
} from '@/features/data-exchange/hooks/useDataExchange';
import ImportFileStep from './ImportFileStep';
import ImportModePicker from './ImportModePicker';
import ImportSummary from './ImportSummary';
import ImportTemplateStep from './ImportTemplateStep';

interface ImportWizardProps {
  open: boolean;
  entity: ImportEntity;
  title: string;
  onClose: () => void;
  onCompleted?: () => void;
}

function statusText(status?: string) {
  if (status === 'processing') return 'Import job is processing...';
  if (status === 'queued') return 'Import job is queued...';
  return 'Import job is starting...';
}

export default function ImportWizard({ open, entity, title, onClose, onCompleted }: ImportWizardProps) {
  const templateFormatId = useId();
  const fileId = useId();
  const [templateFormat, setTemplateFormat] = useState<ExchangeFormat>('csv');
  const [mode, setMode] = useState<ImportMode>('strict');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [jobId, setJobId] = useState('');
  const [localError, setLocalError] = useState('');
  const completedRef = useRef(false);
  const templateMutation = useImportTemplate();
  const importMutation = useImportFile();
  const jobQuery = useImportJob(jobId, Boolean(jobId && !result && !localError));
  const busy = importMutation.isPending || Boolean(jobId);

  useEffect(() => {
    if (!open) return;

    setTemplateFormat('csv');
    setMode('strict');
    setFile(null);
    setResult(null);
    setJobId('');
    setLocalError('');
    completedRef.current = false;
  }, [entity, open]);

  useEffect(() => {
    const job = jobQuery.data;
    if (!job) return;

    if (job.status === 'completed') {
      if (job.result) {
        setResult(job.result);
        setJobId('');
        setLocalError('');

        if (!completedRef.current) {
          completedRef.current = true;
          onCompleted?.();
        }
      } else {
        setJobId('');
        setLocalError('Import completed without a result summary');
      }
    }

    if (job.status === 'failed') {
      setJobId('');
      setLocalError(job.error ?? 'Import failed');
    }
  }, [jobQuery.data, onCompleted]);

  if (!open) {
    return null;
  }

  const handleTemplateDownload = async () => {
    setLocalError('');

    try {
      const template = await templateMutation.mutateAsync({ entity, format: templateFormat });
      downloadFile(template);
    } catch (error) {
      setLocalError(getDataExchangeErrorMessage(error, 'Template could not be downloaded'));
    }
  };

  const handleSubmit = async () => {
    setLocalError('');
    setResult(null);
    completedRef.current = false;

    if (!file) {
      setLocalError('Choose a CSV, Excel, or JSON file first');
      return;
    }

    try {
      const response = await importMutation.mutateAsync({ entity, file, mode });

      if (response.status === 202 && 'id' in response.data) {
        setJobId(response.data.id);
        return;
      }

      if ('totalRows' in response.data) {
        setResult(response.data);
        completedRef.current = true;
        onCompleted?.();
      }
    } catch (error) {
      setLocalError(getDataExchangeErrorMessage(error, 'Import could not be completed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted">Download a template, upload a file, choose a mode, then review the result.</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <ol className="mt-5 grid gap-2 text-sm text-muted sm:grid-cols-5">
          {['Template', 'Upload', 'Mode', 'Submit', 'Summary'].map((step, index) => (
            <li key={step} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
              <span className="font-medium text-foreground">{index + 1}. </span>
              {step}
            </li>
          ))}
        </ol>

        <div className="mt-5 space-y-5">
          <ImportTemplateStep
            formatId={templateFormatId}
            format={templateFormat}
            loading={templateMutation.isPending}
            onFormatChange={setTemplateFormat}
            onDownload={handleTemplateDownload}
          />
          <ImportFileStep fileId={fileId} file={file} onFileChange={setFile} />
          <ImportModePicker mode={mode} onChange={setMode} />

          {jobId ? <FeedbackMessage type="success" message={statusText(jobQuery.data?.status)} /> : null}
          {jobQuery.isError ? (
            <FeedbackMessage type="error" message={getDataExchangeErrorMessage(jobQuery.error, 'Import job could not be loaded')} />
          ) : null}
          {localError ? <FeedbackMessage type="error" message={localError} /> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={busy}
              disabled={!file || busy}
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={handleSubmit}
            >
              Submit Import
            </Button>
          </div>

          {result ? <ImportSummary result={result} /> : null}
        </div>
      </section>
    </div>
  );
}
