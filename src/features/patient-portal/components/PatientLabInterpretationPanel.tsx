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

  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">Patient Explanation</h3>
        <Badge variant="info">AI-Assisted</Badge>
      </div>

      {interpretationQuery.isLoading ? <p className="text-sm text-muted">Loading explanation...</p> : null}

      {interpretationQuery.isError ? (
        <p className="text-sm text-muted">AI explanation is not available yet.</p>
      ) : null}

      {interpretation ? (
        <div className="space-y-3 text-sm text-muted">
          <p>{interpretation.patientVersion}</p>
          {interpretation.recommendations?.length ? (
            <div className="flex flex-wrap gap-2">
              {interpretation.recommendations.map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          ) : null}
          <p className="text-xs">{interpretation.disclaimer ?? 'AI-generated explanation - discuss results with your doctor.'}</p>
        </div>
      ) : null}
    </section>
  );
}
