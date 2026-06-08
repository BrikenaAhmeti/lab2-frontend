import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import Input from '@/ui/atoms/Input';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import PublicDoctorCard from '@/features/public/components/PublicDoctorCard';
import { usePublicStaffList } from '@/features/staff/hooks/useStaff';
import { usePublicDepartments } from '@/features/public/hooks/usePublicCatalog';
import { isDoctorProfile } from '@/features/public/utils/publicStaffPresentation';

export default function PublicDoctorsPage() {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staffId') ?? undefined;
  const isStaffPreview = searchParams.get('preview') === 'staff' && Boolean(staffId);
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
  const previewQuery = useStaffPreviewDetail(isStaffPreview ? staffId ?? '' : '');
  const departmentsQuery = usePublicDepartments();
  const rows = (staffQuery.data?.items ?? []).filter((staff) => (!staffId || staff.id === staffId) && isDoctorProfile(staff));

  return (
    <PublicPageShell
      slug="doctors"
      fallbackTitle="Doctors"
      fallbackBody="Browse public doctor profiles by department."
    >
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-normal text-primary">Care team directory</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-foreground md:text-4xl">Published MedSphere doctors</h2>
              <p className="mt-4 text-base leading-8 text-muted">
                Browse public clinician profiles by specialty, department, and care focus.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-muted shadow-panel">
              {staffQuery.isLoading ? 'Loading profiles' : `${rows.length} published doctor${rows.length === 1 ? '' : 's'}`}
            </div>
          </div>

          <div className="mt-10 rounded-lg border border-border bg-card p-4 shadow-panel">
            <div className="grid gap-3 md:grid-cols-[1fr_260px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, specialty, department..."
                  className="pl-9"
                />
              </div>
              <label className="relative block">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <select
                  aria-label="Filter doctors by department"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-9 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All departments</option>
                  {(departmentsQuery.data?.items ?? []).map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {staffQuery.isLoading ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="min-h-96 animate-pulse rounded-lg border border-border bg-card shadow-panel">
                  <div className="h-40 bg-surface" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-2/3 rounded bg-surface" />
                    <div className="h-6 w-4/5 rounded bg-surface" />
                    <div className="h-16 rounded bg-surface" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!staffQuery.isLoading && staffQuery.isError ? (
            <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted">
              Public doctor profiles are not available right now.
            </div>
          ) : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rows.map((staff, index) => (
                <PublicDoctorCard key={staff.id} staff={staff} index={index} />
              ))}
            </div>
          ) : null}

          {!staffQuery.isLoading && !staffQuery.isError && rows.length === 0 ? (
            <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted">
              No public doctor profiles match these filters.
            </div>
          ) : null}
        </div>
      </section>
    </PublicPageShell>
  );
}
