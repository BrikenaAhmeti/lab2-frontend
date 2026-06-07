import Badge from '@/ui/atoms/Badge';

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

interface UsersTableProps {
  labels: {
    firstName: string;
    lastName: string;
    email: string;
    roles: string;
    empty: string;
  };
  rows: UserRow[];
}

export default function UsersTable({ labels, rows }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">{labels.firstName}</th>
            <th className="px-4 py-3 font-medium">{labels.lastName}</th>
            <th className="px-4 py-3 font-medium">{labels.email}</th>
            <th className="px-4 py-3 font-medium">{labels.roles}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="border-t border-border">
              <td className="px-4 py-6 text-center text-muted" colSpan={4}>
                {labels.empty}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-4 py-3">{row.firstName}</td>
              <td className="px-4 py-3">{row.lastName}</td>
              <td className="px-4 py-3">{row.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {row.roles.map((role) => <Badge key={`${row.id}-${role}`}>{role}</Badge>)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
