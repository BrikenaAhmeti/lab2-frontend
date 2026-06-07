import type { AppointmentView } from '@/lib/api/appointments-api';
import Card from '@/ui/atoms/Card';

function countByStatus(appointments: AppointmentView[], statuses: AppointmentView['status'][]) {
  return appointments.filter((appointment) => statuses.includes(appointment.status)).length;
}

export default function ReceptionistDashboardStats({ appointments }: { appointments: AppointmentView[] }) {
  const stats = [
    { label: 'Today', value: appointments.length },
    { label: 'Waiting', value: countByStatus(appointments, ['SCHEDULED', 'CONFIRMED']) },
    { label: 'Checked in', value: countByStatus(appointments, ['CHECKED_IN']) },
    { label: 'No show', value: countByStatus(appointments, ['NO_SHOW']) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <Card key={item.label}>
          <p className="text-sm text-muted">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
