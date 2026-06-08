import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ClipboardList, FileText, Search, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getConsultationErrorMessage, useMedicalRecords } from '@/features/consultation/hooks/useConsultation';
import { formatClinicalStatus, formatClinicalValue, formatDateTime } from '@/features/consultation/components/clinicalFormat';
import type { MedicalRecordView } from '@/lib/api/medical-records-api';
import Badge from '@/ui/atoms/Badge';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import SelectField from '@/ui/molecules/SelectField';

type RecordStatusFilter = 'all' | 'finalized' | 'draft';

function recordTitle(record: MedicalRecordView) {
  return record.diagnosis || record.chiefComplaint || 'Clinical record';
}

function searchableRecordText(record: MedicalRecordView) {
  return [
    record.patient.name,
    record.patient.email,
    record.patient.phone,
    record.department.name,
    record.staff.displayName,
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

function matchesStatus(record: MedicalRecordView, status: RecordStatusFilter) {
  if (status === 'all') return true;
  return status === 'finalized' ? record.isFinalized : !record.isFinalized;
}

function DetailField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">{value || '-'}</dd>
    </div>
  );
}

function RecordDetail({ record }: { record: MedicalRecordView }) {
  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
            <h2 className="truncate text-base font-semibold text-foreground">{recordTitle(record)}</h2>
          </div>
          <p className="mt-1 text-sm text-muted">{formatDateTime(record.createdAt)}</p>
        </div>
        <Badge variant={record.isFinalized ? 'success' : 'warning'}>
          {record.isFinalized ? 'Finalized' : 'Draft'}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg border border-border bg-surface/45 p-3 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-muted">Patient</p>
          <Link to={`/nurse/patients/${record.patientId}?tab=medical`} className="mt-1 block font-semibold text-primary hover:underline">
            {record.patient.name}
          </Link>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted">Doctor</p>
          <p className="mt-1 font-medium text-foreground">{record.staff.displayName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted">Department</p>
          <p className="mt-1 font-medium text-foreground">{record.department.name}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        <DetailField label="Appointment" value={formatDateTime(record.appointment?.scheduledAt)} />
        <DetailField label="Vitals" value={formatClinicalValue(record.vitals)} />
        <DetailField label="Chief complaint" value={record.chiefComplaint || '-'} />
        <DetailField label="Diagnosis" value={record.diagnosis || '-'} />
        <DetailField label="Treatment plan" value={record.treatmentPlan || '-'} wide />
        <DetailField label="Notes" value={record.notes || '-'} wide />
        <DetailField label="Follow-up instructions" value={record.followUpInstructions || '-'} wide />
      </dl>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface/45 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Prescriptions</h3>
            <Badge>{record.prescriptions.length}</Badge>
          </div>
          {record.prescriptions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No prescriptions attached.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {record.prescriptions.map((prescription) => (
                <li key={prescription.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p className="font-medium text-foreground">{formatDateTime(prescription.issuedAt)}</p>
                  <p className="mt-1 text-muted">
                    {prescription.items.map((item) => `${item.medicationName} ${item.dosage}`.trim()).join(', ')}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface/45 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">Lab orders</h3>
            <Badge>{record.labOrders.length}</Badge>
          </div>
          {record.labOrders.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No lab orders attached.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {record.labOrders.map((order) => (
                <li key={order.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                  <p className="font-medium capitalize text-foreground">{formatClinicalStatus(order.status)}</p>
                  <p className="mt-1 text-muted">
                    {order.items.map((item) => item.labTest.name).join(', ') || order.notes || '-'}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}

export default function NurseMedicalRecordsPage() {
  const { id: selectedRecordId } = useParams<{ id?: string }>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RecordStatusFilter>('all');
  const params = useMemo(() => ({ page: 1, limit: 100 }), []);
  const recordsQuery = useMedicalRecords(params);
  const records = useMemo(() => recordsQuery.data?.items ?? [], [recordsQuery.data?.items]);

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...records]
      .filter((record) => matchesStatus(record, status))
      .filter((record) => (query ? searchableRecordText(record).includes(query) : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [records, search, status]);

  const selectedRecord =
    visibleRecords.find((record) => record.id === selectedRecordId) ?? visibleRecords[0] ?? null;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Nurse', to: '/nurse' }, { label: 'Medical Records' }]} />

      <Card title="Medical Records" subtitle="Patient clinical records, diagnoses, treatments, prescriptions, and labs">
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-surface/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Filters</h2>
                  <p className="mt-0.5 text-xs text-muted">Patient, department, diagnosis, or treatment</p>
                </div>
              </div>
              <Badge variant="neutral">{visibleRecords.length} records</Badge>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px]">
              <Input
                id="nurse-record-search"
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, diagnosis, treatment..."
              />
              <SelectField
                id="nurse-record-status"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as RecordStatusFilter)}
              >
                <option value="all">All records</option>
                <option value="finalized">Finalized</option>
                <option value="draft">Draft</option>
              </SelectField>
            </div>
          </section>

          {recordsQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading medical records...</div>
          ) : null}

          {recordsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getConsultationErrorMessage(recordsQuery.error, 'Medical records could not be loaded')}
            />
          ) : null}

          {!recordsQuery.isLoading && !recordsQuery.isError && visibleRecords.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No medical records match these filters.
            </div>
          ) : null}

          {visibleRecords.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
              <section className="rounded-xl border border-border bg-background">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <ClipboardList className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-foreground">Records</h2>
                </div>
                <ol className="divide-y divide-border">
                  {visibleRecords.map((record) => {
                    const selected = selectedRecord?.id === record.id;

                    return (
                      <li key={record.id}>
                        <Link
                          to={`/nurse/medical-records/${record.id}`}
                          className={clsx(
                            'block p-4 transition hover:bg-surface/70',
                            selected && 'bg-primary/5'
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{recordTitle(record)}</p>
                              <p className="mt-1 truncate text-xs text-muted">{record.patient.name}</p>
                            </div>
                            <Badge variant={record.isFinalized ? 'success' : 'warning'}>
                              {record.isFinalized ? 'Finalized' : 'Draft'}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="truncate">{record.staff.displayName}</span>
                          </div>
                          <p className="mt-2 text-xs text-muted">{formatDateTime(record.createdAt)}</p>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {selectedRecord ? <RecordDetail record={selectedRecord} /> : null}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
