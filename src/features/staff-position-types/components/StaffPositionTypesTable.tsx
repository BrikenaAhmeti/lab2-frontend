import { memo } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { StaffPositionTypeRecord } from '@/lib/api/staff-position-types-api';
import { getStaffPositionTypeDepartments } from '@/features/staff-position-types/hooks/useStaffPositionTypes';

interface StaffPositionTypesTableProps {
  rows: StaffPositionTypeRecord[];
  departments: DepartmentRecord[];
  canManage: boolean;
  canManageRecord?: (record: StaffPositionTypeRecord) => boolean;
  mutationPending: boolean;
  onEdit: (record: StaffPositionTypeRecord) => void;
  onDelete: (record: StaffPositionTypeRecord) => void;
}

function StaffPositionTypesTable({
  rows,
  departments,
  canManage,
  canManageRecord,
  mutationPending,
  onEdit,
  onDelete,
}: StaffPositionTypesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Default Role</th>
            <th className="px-4 py-3 font-medium">Departments</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((record) => {
            const departmentNames = getStaffPositionTypeDepartments(record, departments);
            const canManageRow = canManage && (canManageRecord ? canManageRecord(record) : true);

            return (
              <tr key={record.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{record.name}</p>
                  {record.description ? <p className="mt-1 text-xs text-muted">{record.description}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{record.defaultRoleName}</p>
                  <p className="mt-1 text-xs text-muted">{record.defaultRoleKey}</p>
                </td>
                <td className="px-4 py-3">
                  {departmentNames.length > 0 ? departmentNames.join(', ') : 'All departments'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={record.isActive ? 'success' : 'neutral'}>
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {canManageRow ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" disabled={mutationPending} onClick={() => onEdit(record)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" disabled={mutationPending} onClick={() => onDelete(record)}>
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Read only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(StaffPositionTypesTable);
