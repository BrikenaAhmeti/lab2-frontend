import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import { getPublicCatalogError, usePublicDepartments } from '@/features/public/hooks/usePublicCatalog';

export default function PublicDepartmentsPage() {
  const departmentsQuery = usePublicDepartments();
  const departments = departmentsQuery.data?.items ?? [];

  return (
    <PublicPageShell
      slug="departments"
      fallbackTitle="Departments"
      fallbackBody="Browse active departments available at MedSphere."
    >
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          {departmentsQuery.isLoading ? (
            <div className="rounded-lg border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              Loading departments...
            </div>
          ) : null}

          {departmentsQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getPublicCatalogError(departmentsQuery.error, 'Departments could not be loaded.')}
            />
          ) : null}

          {!departmentsQuery.isLoading && !departmentsQuery.isError && departments.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No departments are available right now.
            </p>
          ) : null}

          {departments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((department) => (
                <article key={department.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-foreground">{department.name}</h2>
                    <Badge variant="success">Active</Badge>
                  </div>
                  {department.description ? <p className="mt-3 text-sm leading-6 text-muted">{department.description}</p> : null}
                  <dl className="mt-4 grid gap-2 text-sm text-muted">
                    {department.floor ? (
                      <div className="flex justify-between gap-4">
                        <dt>Floor</dt>
                        <dd className="font-medium text-foreground">{department.floor}</dd>
                      </div>
                    ) : null}
                    {department.phoneExtension ? (
                      <div className="flex justify-between gap-4">
                        <dt>Extension</dt>
                        <dd className="font-medium text-foreground">{department.phoneExtension}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <Link
                    to={`/services?departmentId=${department.id}`}
                    className="mt-5 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  >
                    View services
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </PublicPageShell>
  );
}
