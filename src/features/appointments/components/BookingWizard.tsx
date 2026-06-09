import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { ServiceRecord } from '@/lib/api/services-api';
import type { StaffDepartment, StaffRecord } from '@/lib/api/staff-api';
import type { AppointmentType, AvailableSlot, AppointmentView } from '@/lib/api/appointments-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import { getStaffName } from '@/features/staff/hooks/useStaff';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  buildAppointmentPayload,
  canConfirmBooking,
  getApiErrorMessage,
  type BookingMode,
  useAppointmentDepartments,
  useAppointmentServices,
  useAppointmentStaff,
  useAvailableSlotsRange,
  useBookAppointment,
} from '../hooks/useAppointments';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import ConfirmStep from './ConfirmStep';
import ServiceStep from './ServiceStep';
import SlotStep from './SlotStep';
import StaffStep from './StaffStep';
import VoiceBookingPanel from './VoiceBookingPanel';
import { formatAppointmentDate, getBookableDateInputValues, getNextBookableDateInputValue } from './appointmentFormat';

type BookingStep = 'Clinical Service' | 'Care Provider' | 'Slot' | 'Confirm';

const portalSteps: BookingStep[] = ['Care Provider', 'Clinical Service', 'Slot', 'Confirm'];
const bookingWindowDays = 21;

interface BookingWizardProps {
  mode: BookingMode;
  patientId?: string;
  patientResolving?: boolean;
  appointmentType?: AppointmentType;
  initialPatient?: PatientRecord | null;
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

function formatCalendarDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function downloadAppointmentCalendar(appointment: AppointmentView) {
  const summary = `MedSphere appointment: ${appointment.service.name}`;
  const description = [
    `Patient: ${appointment.patient.name}`,
    `Department: ${appointment.department.name}`,
    `Doctor or care provider: ${appointment.staff?.displayName ?? 'Care provider'}`,
    appointment.notes ? `Notes: ${appointment.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const contents = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedSphere//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@medsphere`,
    `DTSTAMP:${formatCalendarDate(new Date().toISOString())}`,
    `DTSTART:${formatCalendarDate(appointment.scheduledAt)}`,
    `DTEND:${formatCalendarDate(appointment.endAt)}`,
    `SUMMARY:${escapeCalendarText(summary)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `medsphere-appointment-${appointment.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isActiveDepartmentAssignment(assignment: StaffDepartment) {
  return (assignment.unassignedAt === undefined || assignment.unassignedAt === null) && assignment.department?.isActive !== false;
}

function getDepartmentId(assignment: StaffDepartment) {
  return assignment.departmentId ?? assignment.department?.id ?? '';
}

function getDepartmentName(assignment: StaffDepartment) {
  return assignment.name ?? assignment.department?.name ?? 'Department';
}

function buildDepartmentFallback(assignment: StaffDepartment): DepartmentRecord | null {
  const id = getDepartmentId(assignment);

  if (!id) return null;

  return {
    id,
    name: getDepartmentName(assignment),
    description: null,
    floor: null,
    phoneExtension: null,
    operatingHours: null,
    isActive: assignment.department?.isActive ?? true,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  };
}

function inferDepartmentFromStaff(member: StaffRecord, departments: DepartmentRecord[]) {
  const assignments = (member.departments ?? []).filter(isActiveDepartmentAssignment);
  const selectedAssignment = assignments.find((assignment) => assignment.isPrimary) ?? assignments[0];

  if (!selectedAssignment) return null;

  const departmentId = getDepartmentId(selectedAssignment);
  return departments.find((item) => item.id === departmentId) ?? buildDepartmentFallback(selectedAssignment);
}

function uniqueSlots(slots: AvailableSlot[]) {
  const byRange = new Map<string, AvailableSlot>();

  for (const availableSlot of slots) {
    byRange.set(`${availableSlot.start}-${availableSlot.end}`, availableSlot);
  }

  return [...byRange.values()];
}

function slotTimeKey(slot: AvailableSlot) {
  return `${slot.start.slice(0, 10)}-${slot.startTime}`;
}

export default function BookingWizard({
  mode,
  patientId,
  patientResolving = false,
  appointmentType,
  initialPatient = null,
}: BookingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [department, setDepartment] = useState<DepartmentRecord | null>(null);
  const [service, setService] = useState<ServiceRecord | null>(null);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [date, setDate] = useState(getNextBookableDateInputValue(1));
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [slotSelectedAt, setSlotSelectedAt] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(initialPatient);
  const [notes, setNotes] = useState('');
  const [now, setNow] = useState(Date.now());
  const [bookedAppointment, setBookedAppointment] = useState<AppointmentView | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [slotCheckError, setSlotCheckError] = useState('');
  const [slotCheckLoading, setSlotCheckLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');

  const usesPublicBookingCatalog = mode !== 'receptionist';
  const steps = portalSteps;
  const currentStep = steps[stepIndex] ?? steps[0];
  const slotStepIndex = steps.indexOf('Slot');

  const departmentsQuery = useAppointmentDepartments(usesPublicBookingCatalog);
  const servicesQuery = useAppointmentServices(department?.id ?? '', usesPublicBookingCatalog);
  const staffQuery = useAppointmentStaff(undefined, usesPublicBookingCatalog);
  const shouldKeepSlotsFresh = slotStepIndex >= 0 && stepIndex >= slotStepIndex;
  const bookingDates = useMemo(
    () => getBookableDateInputValues(bookingWindowDays, 1),
    []
  );
  const slotsQuery = useAvailableSlotsRange(
    staff?.id ?? '',
    service?.id ?? '',
    bookingDates,
    shouldKeepSlotsFresh,
    usesPublicBookingCatalog
  );
  const bookMutation = useBookAppointment();
  const actionLoading = bookMutation.isPending;
  const currentDepartmentId = department?.id;
  const occupiedSlots = useMemo(
    () =>
      uniqueSlots(
        (slotsQuery.data ?? [])
          .flatMap((day) => day?.occupiedSlots ?? [])
          .filter((occupiedSlot) => new Date(occupiedSlot.start).getTime() > now)
      ),
    [now, slotsQuery.data]
  );
  const liveSlots = useMemo(() => {
    const occupiedStartTimes = new Set(occupiedSlots.map(slotTimeKey));

    return uniqueSlots(
      (slotsQuery.data ?? [])
        .flatMap((day) => day?.slots ?? [])
        .filter((availableSlot) => new Date(availableSlot.start).getTime() > now)
        .filter((availableSlot) => !occupiedStartTimes.has(slotTimeKey(availableSlot)))
    );
  }, [now, occupiedSlots, slotsQuery.data]);

  const activePatientId = mode === 'receptionist' ? selectedPatient?.id : mode === 'patient' ? patientId : undefined;
  const isPatientResolving = mode === 'patient' && patientResolving && !activePatientId;
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
    if (mode === 'patient' && initialPatient && selectedPatient?.id !== initialPatient.id) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient, mode, selectedPatient?.id]);

  useEffect(() => {
    if (slot && expiresInSeconds === 0) {
      setSlot(null);
      setSlotSelectedAt(null);
    }
  }, [expiresInSeconds, slot]);

  useEffect(() => {
    if (actionLoading) return;
    if (slot && slotsQuery.data && !liveSlots.some((availableSlot) => availableSlot.start === slot.start)) {
      setSlot(null);
      setSlotSelectedAt(null);
      setSlotCheckError('That doctor and time are no longer available. Please choose another slot.');
      if (stepIndex > slotStepIndex) {
        setStepIndex(slotStepIndex);
      }
    }
  }, [actionLoading, liveSlots, slot, slotsQuery.data, stepIndex, slotStepIndex]);

  const canMoveNext = useMemo(() => {
    if (currentStep === 'Clinical Service') return Boolean(service);
    if (currentStep === 'Care Provider') return Boolean(staff && department);
    if (currentStep === 'Slot') return Boolean(slot);

    return canConfirmBooking({
      patientId: activePatientId,
      serviceCatalogId: service?.id,
      staffProfileId: staff?.id,
      scheduledAt: slot?.start,
    });
  }, [activePatientId, currentStep, department, service, staff, slot]);

  const resetAfterService = () => {
    setSlot(null);
    setSlotSelectedAt(null);
    setSlotCheckError('');
  };

  const resetAfterStaff = () => {
    setService(null);
    setSlot(null);
    setSlotSelectedAt(null);
    setSlotCheckError('');
  };

  useEffect(() => {
    if (!staff) return;

    const inferredDepartment = inferDepartmentFromStaff(staff, departmentsQuery.data ?? []);
    if (!inferredDepartment && currentDepartmentId) {
      setDepartment(null);
      return;
    }

    if (inferredDepartment && inferredDepartment.id !== currentDepartmentId) {
      setDepartment(inferredDepartment);
    }
  }, [currentDepartmentId, departmentsQuery.data, staff]);

  const verifySelectedSlot = async () => {
    if (!slot) return false;

    setSlotCheckError('');
    setSlotCheckLoading(true);

    try {
      const result = await slotsQuery.refetch();
      const checkedAt = Date.now();
      const freshSlots = result
        .flatMap((queryResult) => queryResult.data?.slots ?? [])
        .filter((availableSlot) => new Date(availableSlot.start).getTime() > checkedAt);
      const stillAvailable = freshSlots.some(
        (availableSlot) => availableSlot.start === slot.start && availableSlot.end === slot.end
      );

      setNow(checkedAt);

      if (!stillAvailable) {
        setSlot(null);
        setSlotSelectedAt(null);
        setSlotCheckError('That doctor and time are no longer available. Please choose another slot.');
        return false;
      }

      return true;
    } catch (error) {
      setSlotCheckError(getApiErrorMessage(error, 'Could not check that doctor and time. Please try again.'));
      return false;
    } finally {
      setSlotCheckLoading(false);
    }
  };

  const submit = async () => {
    if (!service || !staff || !slot) return;
    setSubmitError('');

    try {
      const slotIsStillAvailable = await verifySelectedSlot();

      if (!slotIsStillAvailable) {
        setSubmitError('Please choose another available appointment time before confirming.');
        setStepIndex(slotStepIndex);
        return;
      }

      const appointment = activePatientId
        ? await bookMutation.mutateAsync(
            buildAppointmentPayload({
              patientId: activePatientId,
              serviceCatalogId: service.id,
              staffProfileId: staff.id,
              scheduledAt: slot.start,
              appointmentType,
              notes,
            })
          )
        : null;

      if (!appointment) return;
      setBookedAppointment(appointment);
      setCalendarError('');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Appointment could not be booked'));
    }
  };

  const resetWizard = () => {
    setStepIndex(0);
    setDepartment(null);
    setService(null);
    setStaff(null);
    setDate(getNextBookableDateInputValue(1));
    setSlot(null);
    setSlotSelectedAt(null);
    setSelectedPatient(null);
    setNotes('');
    setBookedAppointment(null);
    setSubmitError('');
    setSlotCheckError('');
    setSlotCheckLoading(false);
    setCalendarError('');
  };

  const goNext = async () => {
    if (currentStep === 'Slot') {
      const slotIsStillAvailable = await verifySelectedSlot();
      if (!slotIsStillAvailable) return;
    }

    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
  };

  const voicePanel = (
    <VoiceBookingPanel
      mode={mode}
      patientId={activePatientId}
      departmentId={department?.id}
      departmentName={department?.name}
      serviceCatalogId={service?.id}
      serviceName={service?.name}
      staffProfileId={staff?.id}
      staffName={staff ? getStaffName(staff) : undefined}
      scheduledAt={slot?.start}
      className="xl:sticky xl:top-4"
    />
  );

  if (bookedAppointment) {
    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="panel p-5" aria-labelledby="appointment-booked-title">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3 id="appointment-booked-title" className="text-base font-semibold text-foreground">
                  Appointment booked
                </h3>
                <p className="mt-1 text-sm text-muted">The appointment was created successfully.</p>
              </div>
            </div>
            <AppointmentStatusBadge status={bookedAppointment.status} />
          </div>

          <div className="space-y-4">
            <dl className="grid gap-3 rounded-xl border border-border bg-surface/60 p-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted">Patient</dt>
                <dd className="font-medium text-foreground">{bookedAppointment.patient.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Department</dt>
                <dd className="font-medium text-foreground">{bookedAppointment.department.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Clinical service</dt>
                <dd className="font-medium text-foreground">{bookedAppointment.service.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Doctor or care provider</dt>
                <dd className="font-medium text-foreground">{bookedAppointment.staff?.displayName ?? 'Care provider'}</dd>
              </div>
              <div>
                <dt className="text-muted">Date and time</dt>
                <dd className="font-medium text-foreground">{formatAppointmentDate(bookedAppointment.scheduledAt)}</dd>
              </div>
              <div>
                <dt className="text-muted">Duration</dt>
                <dd className="font-medium text-foreground">{`${bookedAppointment.durationMinutes} minutes`}</dd>
              </div>
            </dl>

            {calendarError ? <FeedbackMessage type="error" message={calendarError} /> : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                leftIcon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  try {
                    downloadAppointmentCalendar(bookedAppointment);
                    setCalendarError('');
                  } catch {
                    setCalendarError('Calendar file could not be created in this browser.');
                  }
                }}
              >
                Add to calendar
              </Button>
              <Button type="button" onClick={resetWizard}>
                Book another appointment
              </Button>
            </div>
          </div>
        </section>
        {voicePanel}
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="panel p-5" aria-labelledby="manual-booking-title">
        <div className="mb-4">
          <h3 id="manual-booking-title" className="text-base font-semibold text-foreground">
            {mode === 'receptionist' ? 'Book Appointment for Patient' : 'Book Patient Appointment'}
          </h3>
          <p className="mt-1 text-sm text-muted">{`Step ${stepIndex + 1} of ${steps.length}: ${currentStep}`}</p>
        </div>

        <div className="space-y-5">
          <nav className="grid gap-2 sm:grid-cols-4" aria-label="Booking steps">
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

          {currentStep === 'Clinical Service' ? (
            <ServiceStep
              services={servicesQuery.data ?? []}
              selectedId={service?.id}
              loading={servicesQuery.isLoading}
              error={servicesQuery.isError ? getApiErrorMessage(servicesQuery.error, 'Clinical services could not be loaded') : undefined}
              onSelect={(nextService) => {
                setService(nextService);
                resetAfterService();
              }}
            />
          ) : null}

          {currentStep === 'Care Provider' ? (
            <StaffStep
              staff={staffQuery.data ?? []}
              selectedId={staff?.id}
              loading={staffQuery.isLoading}
              error={staffQuery.isError ? getApiErrorMessage(staffQuery.error, 'Care providers could not be loaded') : undefined}
              onSelect={(nextStaff) => {
                setDepartment(inferDepartmentFromStaff(nextStaff, departmentsQuery.data ?? []));
                setStaff(nextStaff);
                resetAfterStaff();
              }}
            />
          ) : null}

          {currentStep === 'Slot' ? (
            <SlotStep
              date={date}
              slots={liveSlots}
              occupiedSlots={occupiedSlots}
              selectedSlot={slot}
              expiresInSeconds={expiresInSeconds}
              loading={slotsQuery.isLoading}
              error={slotsQuery.isError ? getApiErrorMessage(slotsQuery.error, 'Slots could not be loaded') : undefined}
              minDate={bookingDates[0]}
              maxDate={bookingDates[bookingDates.length - 1]}
              onDateChange={(nextDate) => {
                setDate(nextDate);
                setSlot(null);
                setSlotSelectedAt(null);
                setSlotCheckError('');
              }}
              onSlotSelect={(nextSlot) => {
                setSlot(nextSlot);
                setSlotSelectedAt(Date.now());
                setNow(Date.now());
                setSlotCheckError('');
              }}
            />
          ) : null}

          {currentStep === 'Confirm' ? (
            <ConfirmStep
              mode={mode}
              department={department}
              service={service}
              staff={staff}
              slot={slot}
              patientId={activePatientId}
              patientResolving={isPatientResolving}
              selectedPatient={selectedPatient}
              notes={notes}
              onPatientSelect={setSelectedPatient}
              onNotesChange={setNotes}
            />
          ) : null}

          {currentStep === 'Care Provider' && staff && !department ? (
            <FeedbackMessage
              type="error"
              message="This doctor does not have an active department assignment for online booking."
            />
          ) : null}
          {currentStep === 'Clinical Service' && department ? (
            <FeedbackMessage
              type="success"
              message={`Department selected from doctor: ${department.name}. Choose a clinical service to continue.`}
            />
          ) : null}
          {slotCheckError ? <FeedbackMessage type="error" message={slotCheckError} /> : null}
          {submitError ? <FeedbackMessage type="error" message={submitError} /> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={stepIndex === 0 || actionLoading}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              Back
            </Button>
            {stepIndex < steps.length - 1 ? (
              <Button
                type="button"
                disabled={slotCheckLoading || !canMoveNext}
                loading={slotCheckLoading && currentStep === 'Slot'}
                onClick={goNext}
              >
                Next
              </Button>
            ) : (
              <Button type="button" disabled={!canMoveNext} loading={actionLoading} onClick={submit}>
                Confirm appointment
              </Button>
            )}
          </div>
        </div>
      </section>
      {voicePanel}
    </div>
  );
}
