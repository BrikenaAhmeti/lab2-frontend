import { useMemo, useState } from 'react';
import type { MedicalRecordView } from '@/lib/api/medical-records-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import { formatClinicalStatus, formatDateTime } from './clinicalFormat';

function recordText(record: MedicalRecordView) {
  return [
    record.patient.name,
    record.department.name,
    record.chiefComplaint,
    record.diagnosis,
    record.treatmentPlan,
    record.notes,
    record.followUpInstructions,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function PatientHistoryBrowser({
  records,
  loading,
}: {
  records: MedicalRecordView[];
  loading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => recordText(record).includes(query));
  }, [records, search]);

  return (
    <Card title="Patient History" subtitle="Records, prescriptions, and lab orders">
      <div className="space-y-4">
        <Input
          id="consultation-history-search"
          label="Search History"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {loading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading history...</div> : null}

        {!loading && visibleRecords.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm text-muted">
            No records match this search.
          </div>
        ) : null}

        <ol className="space-y-3">
          {visibleRecords.map((record) => {
            const expanded = expandedId === record.id;

            return (
              <li key={record.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={record.isFinalized ? 'success' : 'warning'}>
                        {record.isFinalized ? 'Finalized' : 'Draft'}
                      </Badge>
                      <span className="text-sm text-muted">{formatDateTime(record.createdAt)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{record.diagnosis || 'No diagnosis'}</p>
                      <p className="mt-1 text-sm text-muted">{record.chiefComplaint || record.department.name}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setExpandedId(expanded ? null : record.id)}
                  >
                    {expanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>

                {expanded ? (
                  <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <dt className="font-medium text-foreground">Treatment Plan</dt>
                      <dd className="mt-1 text-muted">{record.treatmentPlan || '-'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Follow-up</dt>
                      <dd className="mt-1 text-muted">{record.followUpInstructions || '-'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Prescriptions</dt>
                      <dd className="mt-1 text-muted">{record.prescriptions.length}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Lab Orders</dt>
                      <dd className="mt-1 text-muted">
                        {record.labOrders.map((order) => formatClinicalStatus(order.status)).join(', ') || '-'}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}
