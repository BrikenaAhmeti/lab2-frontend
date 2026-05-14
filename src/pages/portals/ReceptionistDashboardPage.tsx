import PortalDashboard from './PortalDashboard';

export default function ReceptionistDashboardPage() {
  return (
    <PortalDashboard
      title="Receptionist Dashboard"
      subtitle="Facility schedule, patient registration, check-in, walk-ins, and appointment booking."
      metrics={[
        { label: 'Today Appointments', value: '128', tone: 'info' },
        { label: 'Checked In', value: '46', tone: 'success' },
        { label: 'Walk-ins', value: '9', tone: 'warning' },
        { label: 'Late Arrivals', value: '4', tone: 'danger' },
      ]}
      tasks={['Book appointment', 'Register patient', 'Check in patient', 'Manage walk-in']}
    />
  );
}
