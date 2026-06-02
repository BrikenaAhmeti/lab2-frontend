import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Input from '@/ui/atoms/Input';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import {
  PublicDoctorsStaticSections,
  PublicPageIntro,
} from '@/features/public/components/PublicStaticSections';
import { getStaffName, usePublicStaffList } from '@/features/staff/hooks/useStaff';
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
  const showLiveDoctors = staffQuery.isLoading || (!staffQuery.isError && rows.length > 0);

  return (
    <PublicPageShell
      slug="doctors"
      fallbackTitle="Doctors"
      fallbackBody="Browse public doctor profiles by department."
    >
      <PublicPageIntro
        eyebrow="Doctors"
        title="A cleaner way to meet the care team."
        body="Explore care-team profiles and the standards that help patients choose the right clinician with more confidence."
      >
        <Link
          to="/contact"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Ask a question
        </Link>
      </PublicPageIntro>

      {showLiveDoctors ? (
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

            {staffQuery.isLoading ? <div className="rounded-lg border border-border p-4 text-sm text-muted">Loading doctors...</div> : null}

            {!staffQuery.isLoading && rows.length > 0 ? (
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
      ) : null}
      <PublicDoctorsStaticSections />
    </PublicPageShell>
  );
}
