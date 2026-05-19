import { useEffect, useMemo, useState } from 'react';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { ServiceRecord } from '@/lib/api/services-api';
import type { StaffRecord } from '@/lib/api/staff-api';
import type { AvailableSlot, AppointmentView } from '@/lib/api/appointments-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  buildAppointmentPayload,
  canConfirmBooking,
  getApiErrorMessage,
  type BookingMode,
  useAppointmentDepartments,
  useAppointmentServices,
  useAppointmentStaff,
  useAvailableSlots,
  useBookAppointment,
} from '../hooks/useAppointments';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import ConfirmStep from './ConfirmStep';
import DepartmentStep from './DepartmentStep';
import ServiceStep from './ServiceStep';
import SlotStep from './SlotStep';
import StaffStep from './StaffStep';
import { formatAppointmentDate, getTodayInputValue } from './appointmentFormat';

const steps = ['Department', 'Service', 'Staff', 'Slot', 'Confirm'] as const;

interface BookingWizardProps {
  mode: BookingMode;
  patientId?: string;
}

function getStepTitle(index: number) {
  return steps[index];
}

export default function BookingWizard({ mode, patientId }: BookingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [department, setDepartment] = useState<DepartmentRecord | null>(null);
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [date, setDate] = useState(getTodayInputValue());
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [slotSelectedAt, setSlotSelectedAt] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [now, setNow] = useState(Date.now());
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentView | null>(null);
  const [submitError, setSubmitError] = useState('');

  const departmentsQuery = useAppointmentDepartments();
  const servicesQuery = useAppointmentServices(department?.id ?? '');
  const staffQuery = useAppointmentStaff(department?.id ?? '');
  const slotsQuery = useAvailableSlots(staff?.id ?? '', service?.id ?? '', date, stepIndex === 3);
  const bookMutation = useBookAppointment();

  const activePatientId = mode === 'receptionist' ? selectedPatient?.id : patientId;
  const expiresInSeconds = useMemo(() => {
    if (!slot || !slotSelectedAt) return null;
    return Math.max(0, 300 - Math.floor((now - slotSelectedAt) / 1000));
  }, [now, slot, slotSelectedAt]);

  useEffect(() => {
    if (!slot) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [slot]);

  useEffect(() => {
    if (slot && expiresInSeconds === 0) {
      setSlot(null);
      setSlotSelectedAt(null);
    }
  }, [expiresInSeconds, slot]);

  const canMoveNext = useMemo(() => {
    if (stepIndex === 0) return Boolean(department);
    if (stepIndex === 1) return Boolean(service);
    if (stepIndex === 2) return Boolean(staff);
    if (stepIndex === 3) return Boolean(slot);

    return canConfirmBooking({
      patientId: activePatientId,
      serviceCatalogId: service?.id,
      staffProfileId: staff?.id,
      scheduledAt: slot?.start,
    });
  }, [activePatientId, department, service, staff, slot, stepIndex]);

  const resetAfterDepartment = () => {
    setService(null);
    setStaff(null);
    setSlot(null);
    setSlotSelectedAt(null);
  };

  const resetAfterService = () => {
    setStaff(null);
    setSlot(null);
    setSlotSelectedAt(null);
  };

  const resetAfterStaff = () => {
    setSlot(null);
    setSlotSelectedAt(null);
  };

  const submit = async () => {
    if (!activePatientId || !service || !staff || !slot) return;
    setSubmitError('');

    try {
      const appointment = await bookMutation.mutateAsync(
        buildAppointmentPayload({
          patientId: activePatientId,
          serviceCatalogId: service.id,
          staffProfileId: staff.id,
          scheduledAt: slot.start,
          notes,
        })
      );
      setBookedAppointment(appointment);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Appointment could not be booked'));
    }
  };

  const resetWizard = () => {
    setStepIndex(0);
    setDepartment(null);
    setService(null);
    setStaff(null);
    setDate(getTodayInputValue());
    setSlot(null);
    setSlotSelectedAt(null);
    setSelectedPatient(null);
    setNotes('');
    setBookedAppointment(null);
    setSubmitError('');
  };

  if (bookedAppointment) {
    return (
      <Card title="Appointment booked" subtitle="The appointment was created successfully">
        <div className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-border bg-surface/60 p-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted">Patient</dt>
              <dd className="font-medium text-foreground">{bookedAppointment.patient.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1">
                <AppointmentStatusBadge status={bookedAppointment.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Department</dt>
              <dd className="font-medium text-foreground">{bookedAppointment.department.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Service</dt>
              <dd className="font-medium text-foreground">{bookedAppointment.service.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Staff</dt>
              <dd className="font-medium text-foreground">{bookedAppointment.staff?.displayName ?? 'Staff member'}</dd>
            </div>
            <div>
              <dt className="text-muted">Date and time</dt>
              <dd className="font-medium text-foreground">{formatAppointmentDate(bookedAppointment.scheduledAt)}</dd>
            </div>
          </dl>
          <Button type="button" onClick={resetWizard}>Book another appointment</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={mode === 'receptionist' ? 'Book Appointment for Patient' : 'Book Appointment'}
      subtitle={`Step ${stepIndex + 1} of ${steps.length}: ${getStepTitle(stepIndex)}`}
    >
      <div className="space-y-5">
        <nav className="grid gap-2 sm:grid-cols-5" aria-label="Booking steps">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              disabled={index > stepIndex}
              onClick={() => setStepIndex(index)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                index === stepIndex ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted'
              }`}
            >
              {step}
            </button>
          ))}
        </nav>

        {stepIndex === 0 ? (
          <DepartmentStep
            departments={departmentsQuery.data ?? []}
            selectedId={department?.id}
            loading={departmentsQuery.isLoading}
            error={departmentsQuery.isError ? getApiErrorMessage(departmentsQuery.error, 'Departments could not be loaded') : undefined}
            onSelect={(nextDepartment) => {
              setDepartment(nextDepartment);
              resetAfterDepartment();
            }}
          />
        ) : null}

        {stepIndex === 1 ? (
          <ServiceStep
            services={servicesQuery.data ?? []}
            selectedId={service?.id}
            loading={servicesQuery.isLoading}
            error={servicesQuery.isError ? getApiErrorMessage(servicesQuery.error, 'Services could not be loaded') : undefined}
            onSelect={(nextService) => {
              setService(nextService);
              resetAfterService();
            }}
          />
        ) : null}

        {stepIndex === 2 ? (
          <StaffStep
            staff={staffQuery.data ?? []}
            selectedId={staff?.id}
            loading={staffQuery.isLoading}
            error={staffQuery.isError ? getApiErrorMessage(staffQuery.error, 'Staff could not be loaded') : undefined}
            onSelect={(nextStaff) => {
              setStaff(nextStaff);
              resetAfterStaff();
            }}
          />
        ) : null}

        {stepIndex === 3 ? (
          <SlotStep
            date={date}
            slots={slotsQuery.data?.slots ?? []}
            selectedSlot={slot}
            expiresInSeconds={expiresInSeconds}
            loading={slotsQuery.isLoading}
            error={slotsQuery.isError ? getApiErrorMessage(slotsQuery.error, 'Slots could not be loaded') : undefined}
            onDateChange={(nextDate) => {
              setDate(nextDate);
              setSlot(null);
              setSlotSelectedAt(null);
            }}
            onSlotSelect={(nextSlot) => {
              setSlot(nextSlot);
              setSlotSelectedAt(Date.now());
              setNow(Date.now());
            }}
          />
        ) : null}

        {stepIndex === 4 ? (
          <ConfirmStep
            mode={mode}
            department={department}
            service={service}
            staff={staff}
            slot={slot}
            patientId={activePatientId}
            selectedPatient={selectedPatient}
            notes={notes}
            onPatientSelect={setSelectedPatient}
            onNotesChange={setNotes}
          />
        ) : null}

        {submitError ? <FeedbackMessage type="error" message={submitError} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={stepIndex === 0 || bookMutation.isPending}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Back
          </Button>
          {stepIndex < steps.length - 1 ? (
            <Button
              type="button"
              disabled={!canMoveNext}
              onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
            >
              Next
            </Button>
          ) : (
            <Button type="button" disabled={!canMoveNext} loading={bookMutation.isPending} onClick={submit}>
              Confirm appointment
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
