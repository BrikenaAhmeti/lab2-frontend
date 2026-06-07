import type { ReactNode } from 'react';
import { CalendarDays, ClipboardList, HeartPulse, IdCard, Mail, MapPin, Phone, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import AppointmentStatusBadge from '@/features/appointments/components/AppointmentStatusBadge';
import { formatAppointmentDate, formatAppointmentTimeRange } from '@/features/appointments/components/appointmentFormat';
import type { AppointmentView } from '@/lib/api/appointments-api';
import type { MedicalRecordView } from '@/lib/api/medical-records-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  formatBloodType,
  formatDate,
  formatDateTime,
  formatEnum,
  formatUnknownValue,
  getStructuredValueEntries,
  type StructuredValueEntry,
} from './patientFormat';

function EmptyValue({ children }: { children?: ReactNode }) {
  return <span className="text-muted">{children || '-'}</span>;
}

function InfoTile({
  label,
  value,
  icon,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg border border-border bg-background p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-muted">{label}</p>
        <p className={emphasis ? 'mt-1 break-words text-sm font-semibold text-foreground' : 'mt-1 break-words text-sm text-foreground'}>
          {value || <EmptyValue />}
        </p>
      </div>
    </div>
  );
}

export function PersonalPanel({ patient, selfView }: { patient: PatientRecord; selfView?: boolean }) {
  const contactLabel = patient.email || patient.phone ? 'Primary contact' : 'Contact';

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <InfoTile
          label="Full name"
          value={`${patient.firstName} ${patient.lastName}`.trim()}
          icon={<UserRound size={18} aria-hidden="true" />}
          emphasis
        />
        <InfoTile
          label="Personal number"
          value={patient.personalNumber}
          icon={<IdCard size={18} aria-hidden="true" />}
          emphasis
        />
        <InfoTile
          label={contactLabel}
          value={patient.email || patient.phone}
          icon={<Mail size={18} aria-hidden="true" />}
        />
        <InfoTile
          label="Phone"
          value={patient.phone}
          icon={<Phone size={18} aria-hidden="true" />}
        />
        <InfoTile
          label="Date of birth"
          value={formatDate(patient.dateOfBirth)}
          icon={<CalendarDays size={18} aria-hidden="true" />}
        />
        <InfoTile
          label="Gender"
          value={formatEnum(patient.gender)}
          icon={<ShieldCheck size={18} aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <InfoTile
          label="Address"
          value={patient.address}
          icon={<MapPin size={18} aria-hidden="true" />}
        />
        <InfoTile
          label="Emergency contact"
          value={[patient.emergencyContact, patient.emergencyPhone].filter(Boolean).join(' - ')}
          icon={<Phone size={18} aria-hidden="true" />}
        />
      </div>

      {selfView ? (
        <p className="rounded-lg border border-border bg-surface/50 px-3 py-2 text-xs text-muted">
          Profile details are managed by the clinic team.
        </p>
      ) : null}
    </div>
  );
}

function StructuredHealthBlock({
  title,
  icon,
  entries,
  emptyText,
}: {
  title: string;
  icon: ReactNode;
  entries: StructuredValueEntry[];
  emptyText: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 text-primary">
          {icon}
        </span>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>

      {entries.length > 0 ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <div key={`${title}-${entry.label}`} className="rounded-lg border border-border/70 bg-surface/50 p-3">
              <dt className="text-xs font-medium uppercase text-muted">{entry.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-surface/50 px-3 py-3 text-sm text-muted">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function MedicalRecordsPreview({
  records,
  loading,
  error,
}: {
  records: MedicalRecordView[];
  loading?: boolean;
  error?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Medical records</h4>
          <p className="mt-1 text-xs text-muted">Latest consultation records from the backend.</p>
        </div>
        <Badge variant="neutral">{records.length} records</Badge>
      </div>

      {loading ? <div className="mt-4 rounded-lg border border-border p-3 text-sm text-muted">Loading medical records...</div> : null}
      {error ? <FeedbackMessage type="error" message={error} /> : null}
      {!loading && !error && records.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-surface/50 px-4 py-6 text-sm text-muted">
          No medical records yet.
        </div>
      ) : null}

      {records.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {records.map((record) => (
            <li key={record.id} className="rounded-lg border border-border/80 bg-surface/40 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{record.diagnosis || 'Consultation record'}</p>
                  <p className="mt-1 text-xs text-muted">
                    {record.department.name} - {formatDateTime(record.createdAt)}
                  </p>
                </div>
                <Badge variant={record.isFinalized ? 'success' : 'warning'}>
                  {record.isFinalized ? 'Finalized' : 'Draft'}
                </Badge>
              </div>

              <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Doctor</dt>
                  <dd className="mt-1 text-foreground">{record.staff.displayName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Chief complaint</dt>
                  <dd className="mt-1 text-foreground">{record.chiefComplaint || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Treatment plan</dt>
                  <dd className="mt-1 text-foreground">{record.treatmentPlan || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Follow-up</dt>
                  <dd className="mt-1 text-foreground">{record.followUpInstructions || '-'}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export function MedicalPanel({
  patient,
  records = [],
  recordsLoading,
  recordsError,
}: {
  patient: PatientRecord;
  records?: MedicalRecordView[];
  recordsLoading?: boolean;
  recordsError?: string;
}) {
  const allergyEntries = getStructuredValueEntries({ allergies: patient.allergies });
  const medicalNoteEntries = getStructuredValueEntries(patient.medicalNotes);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <InfoTile
          label="Blood type"
          value={formatBloodType(patient.bloodType)}
          icon={<HeartPulse size={18} aria-hidden="true" />}
          emphasis
        />
        <InfoTile
          label="Allergies summary"
          value={formatUnknownValue(patient.allergies)}
          icon={<ClipboardList size={18} aria-hidden="true" />}
        />
      </div>

      <StructuredHealthBlock
        title="Allergies"
        icon={<ClipboardList size={16} aria-hidden="true" />}
        entries={allergyEntries}
        emptyText="No allergies recorded."
      />

      <StructuredHealthBlock
        title="Medical notes"
        icon={<Stethoscope size={16} aria-hidden="true" />}
        entries={medicalNoteEntries}
        emptyText="No medical notes recorded."
      />

      <MedicalRecordsPreview records={records} loading={recordsLoading} error={recordsError} />
    </div>
  );
}

export function AppointmentsPanel({
  appointments,
  loading,
  error,
}: {
  appointments: AppointmentView[];
  loading?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-3">
      {loading ? <div className="rounded-lg border border-border p-4 text-sm text-muted">Loading appointments...</div> : null}
      {error ? <FeedbackMessage type="error" message={error} /> : null}
      {!loading && !error && appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/60 px-4 py-8 text-sm">
          <p className="font-medium text-foreground">No appointments yet</p>
          <p className="mt-1 text-muted">This patient does not have any appointments yet.</p>
        </div>
      ) : null}

      {appointments.length > 0 ? (
        <ol className="space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{appointment.service.name}</p>
                  <p className="mt-1 text-sm text-muted">{appointment.department.name}</p>
                  <p className="mt-2 text-sm text-foreground">{formatAppointmentDate(appointment.scheduledAt)}</p>
                  <p className="mt-1 text-xs text-muted">{formatAppointmentTimeRange(appointment)}</p>
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              <dl className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Staff</dt>
                  <dd className="mt-1 font-medium text-foreground">{appointment.staff?.displayName ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Type</dt>
                  <dd className="mt-1 font-medium text-foreground">{formatEnum(appointment.appointmentType)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-muted">Duration</dt>
                  <dd className="mt-1 font-medium text-foreground">{appointment.durationMinutes} min</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

export function EmptyTabPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-4 py-8 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-muted">{text}</p>
    </div>
  );
}
