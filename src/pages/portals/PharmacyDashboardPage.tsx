import PortalDashboard from './PortalDashboard';

export default function PharmacyDashboardPage() {
  return (
    <PortalDashboard
      title="Pharmacy Dashboard"
      subtitle="Prescription queue, dispensing status, allergy warnings, and pharmacy inventory visibility."
      metrics={[
        { label: 'Queued Prescriptions', value: '14', tone: 'warning' },
        { label: 'Ready Pickup', value: '8', tone: 'success' },
        { label: 'Low Stock', value: '5', tone: 'danger' },
        { label: 'Dispensed Today', value: '22', tone: 'info' },
      ]}
      tasks={['Review prescription', 'Dispense medication', 'Check inventory', 'Mark on hold']}
    />
  );
}
