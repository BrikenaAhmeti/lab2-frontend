import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { AppointmentView } from '@/lib/api/appointments-api';
import type { MedicalRecordView } from '@/lib/api/medical-records-api';
import type { CreatePrescriptionPayload, PrescriptionView } from '@/lib/api/prescriptions-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { usePatientDetail } from '@/features/patients/hooks/usePatients';
import AppointmentStatusBadge from '@/features/appointments/components/AppointmentStatusBadge';
import { formatAppointmentDate, isFinalAppointment } from '@/features/appointments/components/appointmentFormat';
import { getApiErrorMessage, useAppointmentDetail, useUpdateAppointmentStatus } from '@/features/appointments/hooks/useAppointments';
import LabOrderPlaceholder from '../components/LabOrderPlaceholder';
import MedicalRecordForm, {
  toMedicalRecordPayload,
  type MedicalRecordFormValues,
} from '../components/MedicalRecordForm';
import PatientHistoryBrowser from '../components/PatientHistoryBrowser';
import PatientSummaryPanel from '../components/PatientSummaryPanel';
import PrescriptionForm from '../components/PrescriptionForm';
import PrescriptionList from '../components/PrescriptionList';
import {
  getConsultationErrorMessage,
  useCreateMedicalRecord,
  useCreatePrescription,
  useFinalizeMedicalRecord,
  useMedicalRecords,
  usePrescriptions,
  useUpdateMedicalRecord,
} from '../hooks/useConsultation';
import Skeleton from '@/ui/atoms/Skeleton';

const ConsultationRecorder = lazy(() => import('../components/ConsultationRecorder'));
const ConsultationAiReportPanel = lazy(() => import('../components/ConsultationAiReportPanel'));
const emptyRecords: MedicalRecordView[] = [];
const emptyPrescriptions: PrescriptionView[] = [];

function findAppointmentRecord(records: MedicalRecordView[], appointmentId: string) {
  return records.find((record) => record.appointmentId === appointmentId) ?? null;
}

function isClosedAppointment(appointment: AppointmentView | null) {
  return appointment ? isFinalAppointment(appointment.status) : true;
}

function ConsultationHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Breadcrumbs items={[{ label: 'Doctor', to: '/doctor' }, { label: 'Consultation' }]} />
      <Link
        to="/doctor"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
    </div>
  );
}

export default function ConsultationPage() {
  const { appointmentId = '' } = useParams();
  const appointmentQuery = useAppointmentDetail(appointmentId);
  const appointment = appointmentQuery.data ?? null;
  const patientQuery = usePatientDetail(appointment?.patientId ?? '');
  const medicalRecordsQuery = useMedicalRecords(
    { page: 1, limit: 25, patientId: appointment?.patientId },
    Boolean(appointment?.patientId)
  );
  const prescriptionsQuery = usePrescriptions(
    { page: 1, limit: 25, patientId: appointment?.patientId, isVoided: false },
    Boolean(appointment?.patientId)
  );
  const createRecordMutation = useCreateMedicalRecord();
  const updateRecordMutation = useUpdateMedicalRecord();
  const finalizeRecordMutation = useFinalizeMedicalRecord();
  const createPrescriptionMutation = useCreatePrescription();
  const updateStatusMutation = useUpdateAppointmentStatus();
  const records = medicalRecordsQuery.data?.items ?? emptyRecords;
  const prescriptions = prescriptionsQuery.data?.items ?? emptyPrescriptions;
  const appointmentRecord = useMemo(
    () => findAppointmentRecord(records, appointmentId),
    [appointmentId, records]
  );
  const [record, setRecord] = useState<MedicalRecordView | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    if (!medicalRecordsQuery.isSuccess) return;
    if (appointmentRecord) {
      setRecord(appointmentRecord);
      return;
    }
    setRecord((current) => (current?.appointmentId === appointmentId ? current : null));
  }, [appointmentId, appointmentRecord, medicalRecordsQuery.isSuccess]);

  const persistMedicalRecord = useCallback(async (values: MedicalRecordFormValues, successMessage: string) => {
    if (!appointment) {
      throw new Error('Appointment details are not loaded.');
    }

    if (!appointment.staffProfileId) {
      setActionError('This appointment has no staff profile assigned.');
      throw new Error('This appointment has no staff profile assigned.');
    }

    setActionError('');
    setActionSuccess('');

    try {
      const payload = toMedicalRecordPayload(values);
      const savedRecord = record
        ? await updateRecordMutation.mutateAsync({ id: record.id, payload })
        : await createRecordMutation.mutateAsync({
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            staffProfileId: appointment.staffProfileId,
            ...payload,
          });

      setRecord(savedRecord);
      setActionSuccess(successMessage);
      return savedRecord;
    } catch (error) {
      setActionError(getConsultationErrorMessage(error, 'Medical record could not be saved'));
      throw error;
    }
  }, [appointment, createRecordMutation, record, updateRecordMutation]);

  const saveRecord = useCallback(async (values: MedicalRecordFormValues) => {
    try {
      await persistMedicalRecord(values, 'Medical record saved.');
    } catch {
      return;
    }
  }, [persistMedicalRecord]);

  const saveAiReportAsRecord = useCallback(async (values: MedicalRecordFormValues) => {
    await persistMedicalRecord(values, 'AI report saved to the medical record draft.');
  }, [persistMedicalRecord]);

  const finalizeRecord = useCallback(async () => {
    if (!record) return;

    setActionError('');
    setActionSuccess('');

    try {
      const finalizedRecord = await finalizeRecordMutation.mutateAsync(record.id);
      setRecord(finalizedRecord);
      setActionSuccess('Medical record finalized.');
    } catch (error) {
      setActionError(getConsultationErrorMessage(error, 'Medical record could not be finalized'));
    }
  }, [finalizeRecordMutation, record]);

  const createPrescription = useCallback(async (payload: CreatePrescriptionPayload) => {
    setActionError('');
    setActionSuccess('');

    try {
      await createPrescriptionMutation.mutateAsync(payload);
      setActionSuccess('Prescription created.');
    } catch (error) {
      setActionError(getConsultationErrorMessage(error, 'Prescription could not be created'));
      throw error;
    }
  }, [createPrescriptionMutation]);

  const completeAppointment = useCallback(async () => {
    if (!appointment) return;

    setActionError('');
    setActionSuccess('');

    try {
      await updateStatusMutation.mutateAsync({ id: appointment.id, payload: { action: 'complete' } });
      setActionSuccess('Appointment completed.');
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'Appointment could not be completed'));
    }
  }, [appointment, updateStatusMutation]);

  if (appointmentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <ConsultationHeader />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-32" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (appointmentQuery.isError || !appointment) {
    return (
      <div className="space-y-4">
        <ConsultationHeader />
        <FeedbackMessage
          type="error"
          message={getApiErrorMessage(appointmentQuery.error, 'Consultation appointment could not be loaded')}
        />
      </div>
    );
  }

  const closed = isClosedAppointment(appointment);

  return (
    <div className="space-y-4">
      <ConsultationHeader />

      <Card
        title={appointment.patient.name}
        subtitle={`${appointment.service.name} - ${formatAppointmentDate(appointment.scheduledAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <AppointmentStatusBadge status={appointment.status} />
            <Button
              type="button"
              variant="secondary"
              disabled={appointment.status !== 'IN_PROGRESS' || updateStatusMutation.isPending}
              loading={updateStatusMutation.isPending}
              onClick={completeAppointment}
            >
              Complete Appointment
            </Button>
          </div>
        }
      >
        <dl className="grid gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="font-medium text-muted">Department</dt>
            <dd className="mt-1 text-foreground">{appointment.department.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Staff</dt>
            <dd className="mt-1 text-foreground">{appointment.staff?.displayName ?? '-'}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Type</dt>
            <dd className="mt-1 text-foreground">{appointment.appointmentType.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted">Duration</dt>
            <dd className="mt-1 text-foreground">{`${appointment.durationMinutes} minutes`}</dd>
          </div>
        </dl>
      </Card>

      {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}
      {actionSuccess ? <FeedbackMessage type="success" message={actionSuccess} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-40" />}>
            <ConsultationRecorder appointment={appointment} disabled={closed} />
          </Suspense>
          <PatientSummaryPanel
            patient={patientQuery.data ?? null}
            records={records}
            prescriptions={prescriptions}
            loading={patientQuery.isLoading || prescriptionsQuery.isLoading}
          />
          <LabOrderPlaceholder
            appointment={appointment}
            medicalRecordId={record?.id ?? null}
            disabled={closed}
            onCreated={() => {
              void medicalRecordsQuery.refetch();
            }}
          />
        </div>

        <div className="space-y-4">
          {closed ? <FeedbackMessage type="error" message="This appointment is closed for clinical edits." /> : null}
          <Suspense fallback={<Skeleton className="h-72" />}>
            <ConsultationAiReportPanel
              appointment={appointment}
              disabled={closed}
              onSaveAsMedicalRecord={saveAiReportAsRecord}
            />
          </Suspense>
          <MedicalRecordForm
            record={record}
            saving={createRecordMutation.isPending || updateRecordMutation.isPending}
            finalizing={finalizeRecordMutation.isPending}
            disabled={closed}
            error={medicalRecordsQuery.isError ? getConsultationErrorMessage(medicalRecordsQuery.error, 'Medical records could not be loaded') : ''}
            onSave={saveRecord}
            onFinalize={finalizeRecord}
          />
          <PrescriptionForm
            medicalRecordId={record?.id ?? null}
            disabled={closed}
            loading={createPrescriptionMutation.isPending}
            error=""
            onSubmit={createPrescription}
          />
          <PrescriptionList prescriptions={prescriptions} loading={prescriptionsQuery.isLoading} />
          <PatientHistoryBrowser records={records} loading={medicalRecordsQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}
