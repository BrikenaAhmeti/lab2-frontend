import { Check, Play } from 'lucide-react';
import type { DispensePharmacyQueuePayload, PharmacyQueueView } from '@/lib/api/pharmacy-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import DispensingForm from './DispensingForm';
import PharmacyStatusBadge from './PharmacyStatusBadge';
import {
  canEditDispensing,
  canFulfillQueue,
  canStartQueue,
  formatPharmacyDateTime,
  normalizeAllergies,
} from './pharmacyFormat';

interface PharmacyQueueDetailProps {
  queue: PharmacyQueueView | null;
  loading?: boolean;
  canDispense?: boolean;
  actionError?: string;
  startLoading?: boolean;
  dispenseLoading?: boolean;
  fulfillLoading?: boolean;
  onStart: (queue: PharmacyQueueView) => void;
  onSaveDispensing: (queue: PharmacyQueueView, payload: DispensePharmacyQueuePayload) => void;
  onFulfill: (queue: PharmacyQueueView) => void;
}

export default function PharmacyQueueDetail({
  queue,
  loading,
  canDispense,
  actionError,
  startLoading,
  dispenseLoading,
  fulfillLoading,
  onStart,
  onSaveDispensing,
  onFulfill,
}: PharmacyQueueDetailProps) {
  if (loading) {
    return <aside className="rounded-lg border border-border bg-card p-5 text-sm text-muted">Loading prescription details...</aside>;
  }

  if (!queue) {
    return <aside className="rounded-lg border border-border bg-card p-5 text-sm text-muted">Select a prescription to dispense.</aside>;
  }

  const allergies = normalizeAllergies(queue.patient.allergies);
  const editable = canDispense && canEditDispensing(queue);
  const fulfillReady = canDispense && canFulfillQueue(queue);

  return (
    <aside className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <PharmacyStatusBadge status={queue.status} />
          {queue.prescription.isVoided ? <Badge variant="danger">Voided</Badge> : null}
        </div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">{queue.patient.name}</h2>
        <p className="mt-1 text-sm text-muted">{queue.patient.phone ?? queue.patient.email ?? 'No contact on file'}</p>
      </div>

      {allergies.length > 0 ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <p className="font-semibold">Allergies</p>
          <p className="mt-1">{allergies.join(', ')}</p>
        </div>
      ) : null}

      <dl className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-1">
        <div>
          <dt className="text-muted">Prescribing doctor</dt>
          <dd className="mt-1 font-medium text-foreground">{queue.prescription.staff.displayName}</dd>
        </div>
        <div>
          <dt className="text-muted">Requested at</dt>
          <dd className="mt-1 font-medium text-foreground">{formatPharmacyDateTime(queue.requestedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Issued at</dt>
          <dd className="mt-1 font-medium text-foreground">{formatPharmacyDateTime(queue.prescription.issuedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Expires at</dt>
          <dd className="mt-1 font-medium text-foreground">{formatPharmacyDateTime(queue.prescription.expiresAt)}</dd>
        </div>
      </dl>

      {queue.prescription.notes ? <p className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">{queue.prescription.notes}</p> : null}
      {queue.notes ? <p className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">{queue.notes}</p> : null}

      {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}

      <div className="flex flex-wrap gap-2">
        {canDispense && canStartQueue(queue) ? (
          <Button type="button" loading={startLoading} leftIcon={<Play className="h-4 w-4" />} onClick={() => onStart(queue)}>
            Start
          </Button>
        ) : null}
        {fulfillReady ? (
          <Button
            type="button"
            loading={fulfillLoading}
            leftIcon={<Check className="h-4 w-4" />}
            onClick={() => onFulfill(queue)}
          >
            Fulfill
          </Button>
        ) : null}
      </div>

      {!canDispense ? <FeedbackMessage type="error" message="You can view this queue, but dispensing actions need pharmacy:dispense." /> : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Medications</h3>
        <DispensingForm
          queue={queue}
          loading={dispenseLoading}
          disabled={!editable}
          onSave={(payload) => onSaveDispensing(queue, payload)}
        />
      </section>
    </aside>
  );
}
