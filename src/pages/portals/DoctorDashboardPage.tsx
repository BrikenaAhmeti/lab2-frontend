import PortalDashboard from './PortalDashboard';

export default function DoctorDashboardPage() {
  return (
    <PortalDashboard
      title="Doctor Dashboard"
      subtitle="Clinical schedule, consultation tools, patient records, prescriptions, lab orders, and AI review flows."
      metrics={[
        { label: 'Today Schedule', value: '12', tone: 'info' },
        { label: 'Pending Reviews', value: '5', tone: 'warning' },
        { label: 'Unread Messages', value: '9', tone: 'danger' },
        { label: 'Completed Notes', value: '7', tone: 'success' },
      ]}
      tasks={['Open consultation', 'Review lab result', 'Create prescription', 'Browse patient records']}
    />
  );
}
