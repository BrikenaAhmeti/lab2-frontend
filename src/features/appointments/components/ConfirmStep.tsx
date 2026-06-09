import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { ServiceRecord } from '@/lib/api/services-api';
import type { StaffRecord } from '@/lib/api/staff-api';
import type { AvailableSlot } from '@/lib/api/appointments-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import { getStaffName } from '@/features/staff/hooks/useStaff';
import { getPatientName } from '@/features/patients/hooks/usePatients';
import type { BookingMode } from '../hooks/useAppointments';
import PatientSelector from './PatientSelector';
import { formatAppointmentDate } from './appointmentFormat';

interface ConfirmStepProps {
  mode: BookingMode;
  department: DepartmentRecord | null;
  service: ServiceRecord | null;
  staff: StaffRecord | null;
  slot: AvailableSlot | null;
  patientId?: string;
  patientResolving?: boolean;
  selectedPatient: PatientRecord | null;
  notes: string;
  onPatientSelect: (patient: PatientRecord) => void;
  onNotesChange: (notes: string) => void;
}

export default function ConfirmStep({
  mode,
  department,
  service,
  staff,
  slot,
  patientId,
  patientResolving = false,
  selectedPatient,
  notes,
  onPatientSelect,
  onNotesChange,
}: ConfirmStepProps) {
  const patientName =
    selectedPatient ? getPatientName(selectedPatient) : patientId ? 'Your profile' : '';

  return (
    <div className="space-y-4">
      {mode === 'receptionist' ? (
        <PatientSelector selectedPatient={selectedPatient} onSelect={onPatientSelect} />
      ) : null}

      {mode === 'patient' && patientResolving ? (
        <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading your patient profile...</div>
      ) : null}

      <dl className="grid gap-3 rounded-xl border border-border bg-surface/60 p-4 text-sm md:grid-cols-2">
        <div>
          <dt className="text-muted">Patient</dt>
          <dd className="font-medium text-foreground">{patientName || 'Select a patient'}</dd>
        </div>
        <div>
          <dt className="text-muted">Department</dt>
          <dd className="font-medium text-foreground">{department?.name ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-muted">Clinical service</dt>
          <dd className="font-medium text-foreground">{service?.name ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-muted">Doctor or care provider</dt>
          <dd className="font-medium text-foreground">{staff ? getStaffName(staff) : '-'}</dd>
        </div>
        <div>
          <dt className="text-muted">Date and time</dt>
          <dd className="font-medium text-foreground">{slot ? formatAppointmentDate(slot.start) : '-'}</dd>
        </div>
        <div>
          <dt className="text-muted">Duration</dt>
          <dd className="font-medium text-foreground">{service ? `${service.defaultDurationMinutes} minutes` : '-'}</dd>
        </div>
      </dl>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Notes</span>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Optional notes for the care team, such as visit reason or accessibility needs"
        />
      </label>
    </div>
  );
}
