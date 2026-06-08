import type { ServiceRecord } from '@/lib/api/services-api';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface ServiceStepProps {
  services: ServiceRecord[];
  selectedId?: string;
  loading: boolean;
  error?: string;
  onSelect: (service: ServiceRecord) => void;
}

export default function ServiceStep({ services, selectedId, loading, error, onSelect }: ServiceStepProps) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading clinical services...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
        No active clinical services are available for this department.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onSelect(service)}
          className={`rounded-xl border p-4 text-left transition hover:border-primary ${
            selectedId === service.id ? 'border-primary bg-primary/10' : 'border-border bg-background'
          }`}
        >
          <span className="font-semibold text-foreground">{service.name}</span>
          {service.description ? <span className="mt-1 block text-sm text-muted">{service.description}</span> : null}
          <span className="mt-3 block text-xs text-muted">
            {`${service.defaultDurationMinutes} min | Estimated fee EUR ${Number(service.defaultPrice).toFixed(2)}`}
          </span>
        </button>
      ))}
    </div>
  );
}
