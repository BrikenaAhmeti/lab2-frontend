import PortalDashboard from './PortalDashboard';

export default function NurseDashboardPage() {
  return (
    <PortalDashboard
      title="Nurse Dashboard"
      subtitle="Department patient lists, triage, vitals entry, and appointment preparation workflows."
      metrics={[
        { label: 'Checked In', value: '18', tone: 'success' },
        { label: 'Waiting Triage', value: '6', tone: 'warning' },
        { label: 'Vitals Due', value: '11', tone: 'info' },
        { label: 'Escalations', value: '2', tone: 'danger' },
      ]}
      tasks={['Record vitals', 'Prepare appointment', 'View medical notes', 'Assist check-in']}
    />
  );
}
