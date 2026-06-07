import type { PrescriptionView } from '@/lib/api/prescriptions-api';
import Badge from '@/ui/atoms/Badge';
import Card from '@/ui/atoms/Card';
import { formatClinicalStatus, formatDateTime, formatShortDate } from './clinicalFormat';

export default function PrescriptionList({
  prescriptions,
  loading,
}: {
  prescriptions: PrescriptionView[];
  loading?: boolean;
}) {
  return (
    <Card title="Prescriptions" subtitle="Patient medication history">
      {loading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading prescriptions...</div> : null}

      {!loading && prescriptions.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm text-muted">
          No prescriptions yet.
        </div>
      ) : null}

      <ol className="space-y-3">
        {prescriptions.map((prescription) => (
          <li key={prescription.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={prescription.isVoided ? 'danger' : 'success'}>{prescription.status}</Badge>
                  {prescription.pharmacyStatus ? <Badge>{formatClinicalStatus(prescription.pharmacyStatus)}</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-muted">{formatDateTime(prescription.issuedAt)}</p>
              </div>
              <p className="text-sm text-muted">{`Expires ${formatShortDate(prescription.expiresAt)}`}</p>
            </div>

            <ul className="mt-3 space-y-2">
              {prescription.items.map((item) => (
                <li key={item.id} className="text-sm">
                  <span className="font-medium text-foreground">{item.medicationName}</span>
                  <span className="text-muted">{` ${item.dosage}, ${item.frequency}`}</span>
                  {item.durationInstructions ? (
                    <span className="text-muted">{`, ${item.durationInstructions}`}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Card>
  );
}
