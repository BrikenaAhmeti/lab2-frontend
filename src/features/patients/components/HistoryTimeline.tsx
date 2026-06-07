import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import type { PatientTimelineItem, PatientTimelineType } from '@/lib/api/patients-api';
import { formatDateTime, formatEnum } from './patientFormat';

const typeLabels: Record<PatientTimelineType, string> = {
  appointment: 'Appointment',
  medical_record: 'Record',
  prescription: 'Prescription',
  lab_order: 'Lab',
  billing: 'Billing',
};

const entityPaths: Record<string, string> = {
  appointments: 'appointments',
  medical_records: 'medical-records',
  prescriptions: 'prescriptions',
  lab_orders: 'lab/orders',
  billings: 'billing',
};

function detailPath(item: PatientTimelineItem, basePath: string) {
  const path = entityPaths[item.reference.entity] ?? item.reference.entity.replaceAll('_', '-');
  return `${basePath}/${path}/${item.reference.id}`;
}

export default function HistoryTimeline({
  items,
  loading,
  error,
  basePath,
}: {
  items: PatientTimelineItem[];
  loading?: boolean;
  error?: string;
  basePath: string;
}) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading history...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm text-muted">
        No patient history yet.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{typeLabels[item.type]}</Badge>
                {item.status ? <Badge>{formatEnum(item.status)}</Badge> : null}
                <span className="text-sm text-muted">{formatDateTime(item.occurredAt)}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                {item.summary ? <p className="mt-1 text-sm text-muted">{item.summary}</p> : null}
              </div>
            </div>
            <Link to={detailPath(item, basePath)} className="text-sm font-medium text-primary hover:underline">
              View details
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
