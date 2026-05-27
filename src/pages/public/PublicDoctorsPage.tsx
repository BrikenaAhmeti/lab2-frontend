import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Input from '@/ui/atoms/Input';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import { getApiErrorMessage, getStaffName, usePublicStaffList } from '@/features/staff/hooks/useStaff';
import { usePublicDepartments } from '@/features/public/hooks/usePublicCatalog';
import type { StaffDepartment, StaffRecord } from '@/lib/api/staff-api';

function departmentName(department: StaffDepartment) {
  return department.name ?? department.department?.name ?? 'Department';
}

function doctorTitle(staff: StaffRecord) {
  return staff.positionType?.name ?? staff.specialization ?? 'Doctor';
}

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
      page: 1,
      limit: 50,
    }),
    [departmentId, search, staffId]
  );
  const staffQuery = usePublicStaffList(params);
  const departmentsQuery = usePublicDepartments();
  const rows = (staffQuery.data?.items ?? []).filter((staff) => !staffId || staff.id === staffId);

  return (
    <PublicPageShell
      slug="doctors"
      fallbackTitle="Doctors"
      fallbackBody="Browse public doctor profiles by department."
    >
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search doctors..." />
            <select
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All departments</option>
              {(departmentsQuery.data?.items ?? []).map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>

          {staffQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading doctors...</div> : null}
          {staffQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(staffQuery.error, 'Doctors could not be loaded')} /> : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No doctors found.
            </p>
          ) : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {rows.map((staff) => (
                <article key={staff.id} className="rounded-lg border border-border bg-card p-5">
                  <h2 className="font-semibold text-foreground">{getStaffName(staff)}</h2>
                  <p className="mt-1 text-sm text-muted">{doctorTitle(staff)}</p>
                  {staff.bio ? <p className="mt-3 text-sm text-muted">{staff.bio}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {staff.departments?.map((department) => (
                      <Badge key={department.id}>{departmentName(department)}</Badge>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </PublicPageShell>
  );
}
