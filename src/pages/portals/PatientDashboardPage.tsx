import PatientFeedbackPrompt from '@/features/feedback/components/PatientFeedbackPrompt';
import PortalDashboard from './PortalDashboard';

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      <PatientFeedbackPrompt />
      <PortalDashboard
        title="Patient Dashboard"
        subtitle="Appointments, lab results, prescriptions, documents, and care messages will live in this portal."
        metrics={[
          { label: 'Upcoming Appointments', value: '2', tone: 'info' },
          { label: 'Unread Notifications', value: '4', tone: 'warning' },
          { label: 'Available Documents', value: '8', tone: 'success' },
          { label: 'Open Bills', value: '1', tone: 'danger' },
        ]}
        tasks={['Book an appointment', 'Review lab results', 'Download prescriptions', 'Message care team']}
      />
    </div>
  );
}
