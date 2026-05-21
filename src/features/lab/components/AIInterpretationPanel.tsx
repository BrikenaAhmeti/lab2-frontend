import { Sparkles } from 'lucide-react';
import type { TriggerLabOrderAiResponse } from '@/lib/api/lab-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';

export default function AIInterpretationPanel({
  loading,
  result,
  onTrigger,
}: {
  loading?: boolean;
  result?: TriggerLabOrderAiResponse | null;
  onTrigger: () => void;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">AI Interpretation</h3>
            <Badge variant="info">Sprint 3</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">Clinical interpretation is waiting for the AI service.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={loading}
          leftIcon={<Sparkles className="h-4 w-4" />}
          onClick={onTrigger}
        >
          Trigger AI
        </Button>
      </div>

      {result ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge>{result.status.replaceAll('_', ' ')}</Badge>
          <span>{result.message}</span>
        </div>
      ) : null}
    </section>
  );
}
