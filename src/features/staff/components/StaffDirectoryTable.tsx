import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import { getStaffEmail, getStaffName, getStaffStatus } from '@/features/staff/hooks/useStaff';
import type { StaffRecord } from '@/lib/api/staff-api';

interface StaffDirectoryTableProps {
  rows: StaffRecord[];
  onDeactivate: (staff: StaffRecord) => void;
  loading?: boolean;
}

function statusVariant(status: string): 'success' | 'neutral' {
  return status.toLowerCase() === 'active' ? 'success' : 'neutral';
}

export default function StaffDirectoryTable({ rows, loading, onDeactivate }: StaffDirectoryTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Staff</th>
            <th className="px-4 py-3 font-medium">Position</th>
            <th className="px-4 py-3 font-medium">Departments</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((staff) => {
            const status = getStaffStatus(staff);

            return (
              <tr key={staff.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{getStaffName(staff)}</p>
                  <p className="mt-1 text-xs text-muted">{getStaffEmail(staff)}</p>
                </td>
                <td className="px-4 py-3">{staff.positionType?.name ?? staff.specialization ?? '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {staff.departments?.length ? (
                      staff.departments.map((department) => <Badge key={department.id}>{department.name}</Badge>)
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(status)}>{status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/staff/${staff.id}`}>
                      <Button size="sm" variant="secondary">View</Button>
                    </Link>
                    <Button size="sm" variant="danger" loading={loading} onClick={() => onDeactivate(staff)}>
                      Deactivate
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
