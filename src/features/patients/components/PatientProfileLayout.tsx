import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  getApiErrorMessage as getAppointmentErrorMessage,
  useAppointmentList,
} from '@/features/appointments/hooks/useAppointments';
import { getConsultationErrorMessage, useMedicalRecords } from '@/features/consultation/hooks/useConsultation';
import type { PatientRecord } from '@/lib/api/patients-api';
import { getApiErrorMessage, getPatientName, usePatientTimeline } from '@/features/patients/hooks/usePatients';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import PatientBillingPanel from '@/features/billing/components/PatientBillingPanel';
import HistoryTimeline from './HistoryTimeline';
import PatientTabs, { type PatientProfileTab } from './PatientTabs';
import { AppointmentsPanel, EmptyTabPanel, MedicalPanel, PersonalPanel } from './PatientInfoPanels';
import { formatDate } from './patientFormat';

const allowedTabs: PatientProfileTab[] = ['personal', 'medical', 'history', 'documents', 'appointments', 'billing'];

function getTab(value: string | null): PatientProfileTab {
  return allowedTabs.includes(value as PatientProfileTab) ? (value as PatientProfileTab) : 'personal';
}

export default function PatientProfileLayout({
  patient,
  selfView = false,
  basePath,
}: {
  patient: PatientRecord;
  selfView?: boolean;
  basePath: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getTab(searchParams.get('tab'));
  const timelineQuery = usePatientTimeline(patient.id);
  const appointmentParams = useMemo(() => ({ page: 1, limit: 50, patientId: patient.id }), [patient.id]);
  const appointmentsQuery = useAppointmentList(
    appointmentParams,
    activeTab === 'appointments' && Boolean(patient.id)
  );
  const medicalRecordParams = useMemo(() => ({ page: 1, limit: 5, patientId: patient.id }), [patient.id]);
  const medicalRecordsQuery = useMedicalRecords(
    medicalRecordParams,
    activeTab === 'medical' && Boolean(patient.id)
  );
  const patientListPath = basePath === '/receptionist' ? '/receptionist/patients' : '/admin/patients';

  return (
    <Card
      title={getPatientName(patient)}
      subtitle={`Patient profile${patient.dateOfBirth ? `, born ${formatDate(patient.dateOfBirth)}` : ''}`}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!selfView ? (
            <Link
              to={patientListPath}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to patients
            </Link>
          ) : null}
          <Badge variant={patient.isActive ? 'success' : 'neutral'}>{patient.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
      }
    >
      <div className="space-y-4">
        {selfView ? (
          <p className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">
            Staff-entered medical fields are shown read-only.
          </p>
        ) : null}
        <PatientTabs activeTab={activeTab} onChange={(tab) => setSearchParams({ tab })} />
        {activeTab === 'personal' ? <PersonalPanel patient={patient} selfView={selfView} /> : null}
        {activeTab === 'medical' ? (
          <MedicalPanel
            patient={patient}
            records={medicalRecordsQuery.data?.items ?? []}
            recordsLoading={medicalRecordsQuery.isLoading}
            recordsError={
              medicalRecordsQuery.isError
                ? getConsultationErrorMessage(medicalRecordsQuery.error, 'Medical records could not be loaded')
                : ''
            }
          />
        ) : null}
        {activeTab === 'history' ? (
          <HistoryTimeline
            items={timelineQuery.data ?? []}
            loading={timelineQuery.isLoading}
            error={timelineQuery.isError ? getApiErrorMessage(timelineQuery.error, 'Patient history could not be loaded') : ''}
            basePath={basePath}
          />
        ) : null}
        {activeTab === 'documents' ? (
          <EmptyTabPanel title="No documents connected yet" text="Lab reports, prescriptions, and uploads will appear here when those modules are wired." />
        ) : null}
        {activeTab === 'appointments' ? (
          <AppointmentsPanel
            appointments={appointmentsQuery.data?.items ?? []}
            loading={appointmentsQuery.isLoading}
            error={
              appointmentsQuery.isError
                ? getAppointmentErrorMessage(appointmentsQuery.error, 'Appointments could not be loaded')
                : ''
            }
          />
        ) : null}
        {activeTab === 'billing' ? (
          <PatientBillingPanel patientId={patient.id} />
        ) : null}
      </div>
    </Card>
  );
}
