import PortalDashboard from './PortalDashboard';

export default function LabDashboardPage() {
  return (
    <PortalDashboard
      title="Lab Dashboard"
      subtitle="Lab order queue, result entry, flagging, completion status, and daily volume tracking."
      metrics={[
        { label: 'Pending Orders', value: '19', tone: 'warning' },
        { label: 'In Progress', value: '7', tone: 'info' },
        { label: 'Critical Flags', value: '3', tone: 'danger' },
        { label: 'Completed Today', value: '31', tone: 'success' },
      ]}
      tasks={['Start lab order', 'Enter results', 'Flag critical result', 'Complete order']}
    />
  );
}
