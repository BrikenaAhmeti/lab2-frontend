import { Loader2 } from 'lucide-react';
import Badge from '@/ui/atoms/Badge';
import { usePatientLabInterpretation } from '../hooks/usePatientPortal';

export default function PatientLabInterpretationPanel({
  labOrderId,
  enabled,
}: {
  labOrderId: string;
  enabled: boolean;
}) {
  const interpretationQuery = usePatientLabInterpretation(labOrderId, enabled);
  const interpretation = interpretationQuery.data;
  const patientVersion = interpretation?.patientVersion?.trim();
  const isPending = !interpretationQuery.isLoading && !interpretationQuery.isError && !patientVersion;
  const isPreparing = (interpretationQuery.isLoading || isPending) && !patientVersion;

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Patient Explanation</h3>
        <Badge variant="info">AI-Assisted</Badge>
      </div>

      {isPreparing ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm">
          <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />
          <div>
            <p className="font-medium text-foreground">AI explanation is being prepared</p>
            <p className="mt-1 text-xs text-muted">We will keep checking and show it here once it is ready.</p>
          </div>
        </div>
      ) : null}

      {interpretationQuery.isError ? (
        <p className="text-sm text-muted">AI explanation could not be loaded right now.</p>
      ) : null}

      {patientVersion ? (
        <div className="space-y-3 text-sm text-muted">
          <p>{patientVersion}</p>
          {interpretation?.recommendations?.length ? (
            <div className="flex flex-wrap gap-2">
              {interpretation.recommendations.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          ) : null}
          <p className="text-xs">
            {interpretation?.disclaimer ?? 'AI-generated explanation - discuss results with your doctor.'}
          </p>
        </div>
      ) : null}
    </section>
  );
}
