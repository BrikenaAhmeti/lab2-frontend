import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { getApiErrorMessage, getStaffName, usePublicStaffList, useStaffDepartments } from '@/features/staff/hooks/useStaff';

export default function PublicDoctorsPage() {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staffId') ?? undefined;
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const params = useMemo(
    () => ({
      staffId,
      search: search || undefined,
      departmentId: departmentId || undefined,
    }),
    [departmentId, search, staffId]
  );
  const staffQuery = usePublicStaffList(params);
  const departmentsQuery = useStaffDepartments();
  const rows = (staffQuery.data?.items ?? []).filter((staff) => !staffId || staff.id === staffId);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card title="Doctors" subtitle="Public staff directory">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search doctors..." />
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All departments</option>
              {(departmentsQuery.data ?? []).map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>

          {staffQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading doctors...</div> : null}
          {staffQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(staffQuery.error, 'Doctors could not be loaded')} /> : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No doctors found.
            </p>
          ) : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((staff) => (
                <section key={staff.id} className="rounded-xl border border-border p-4">
                  <h2 className="font-semibold text-foreground">{getStaffName(staff)}</h2>
                  <p className="mt-1 text-sm text-muted">{staff.positionType?.name ?? staff.specialization ?? 'Doctor'}</p>
                  {staff.bio ? <p className="mt-3 text-sm text-muted">{staff.bio}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {staff.departments?.map((department) => <Badge key={department.id}>{department.name}</Badge>)}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
