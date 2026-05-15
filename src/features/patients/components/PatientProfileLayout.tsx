import { useSearchParams } from 'react-router-dom';
import type { PatientRecord } from '@/lib/api/patients-api';
import { getApiErrorMessage, getPatientName, usePatientTimeline } from '@/features/patients/hooks/usePatients';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import HistoryTimeline from './HistoryTimeline';
import PatientTabs, { type PatientProfileTab } from './PatientTabs';
import { EmptyTabPanel, MedicalPanel, PersonalPanel } from './PatientInfoPanels';
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

  return (
    <Card
      title={getPatientName(patient)}
      subtitle={`Patient profile${patient.dateOfBirth ? `, born ${formatDate(patient.dateOfBirth)}` : ''}`}
      actions={<Badge variant={patient.isActive ? 'success' : 'neutral'}>{patient.isActive ? 'Active' : 'Inactive'}</Badge>}
    >
      <div className="space-y-4">
        {selfView ? (
          <p className="rounded-lg bg-surface px-3 py-2 text-sm text-muted">
            Staff-entered medical fields are shown read-only.
          </p>
        ) : null}
        <PatientTabs activeTab={activeTab} onChange={(tab) => setSearchParams({ tab })} />
        {activeTab === 'personal' ? <PersonalPanel patient={patient} selfView={selfView} /> : null}
        {activeTab === 'medical' ? <MedicalPanel patient={patient} /> : null}
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
          <EmptyTabPanel title="Appointments are not wired yet" text="The appointment module will fill this tab once MS-16 and MS-17 are available." />
        ) : null}
        {activeTab === 'billing' ? (
          <EmptyTabPanel title="Billing is not wired yet" text="Billing records will appear here once the billing API is available." />
        ) : null}
      </div>
    </Card>
  );
}
