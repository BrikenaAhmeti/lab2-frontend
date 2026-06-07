import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Input from '@/ui/atoms/Input';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import {
  PublicPageIntro,
  PublicServicesStaticSections,
} from '@/features/public/components/PublicStaticSections';
import {
  usePublicDepartments,
  usePublicServices,
} from '@/features/public/hooks/usePublicCatalog';
import { formatCurrency } from '@/utils/formatters/currency';

function price(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) ? formatCurrency(amount) : String(value);
}

export default function PublicServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const departmentId = searchParams.get('departmentId') ?? '';
  const serviceParams = useMemo(
    () => ({
      search: search || undefined,
      departmentId: departmentId || undefined,
    }),
    [departmentId, search]
  );
  const departmentsQuery = usePublicDepartments();
  const servicesQuery = usePublicServices(serviceParams);
  const services = servicesQuery.data?.items ?? [];
  const showLiveServices = servicesQuery.isLoading || (!servicesQuery.isError && services.length > 0);

  const selectDepartment = (value: string) => {
    setSearchParams(value ? { departmentId: value } : {});
  };

  return (
    <PublicPageShell
      slug="services"
      fallbackTitle="Clinical Services"
      fallbackBody="Browse active clinical services by department."
    >
      <PublicPageIntro
        eyebrow="Clinical services"
        title="Understand care options before choosing an appointment time."
        body="Filter available clinical services by department and review what each care path usually includes before booking."
      >
        <Link
          to="/register"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Patient registration
        </Link>
      </PublicPageIntro>

      {showLiveServices ? (
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px]">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clinical services..." />
              <select
                value={departmentId}
                onChange={(event) => selectDepartment(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              >
                <option value="">All departments</option>
                {(departmentsQuery.data?.items ?? []).map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>

            {servicesQuery.isLoading ? (
              <div className="rounded-lg border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
                Loading clinical services...
              </div>
            ) : null}

            {services.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <article key={service.id} className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-foreground">{service.name}</h2>
                      {service.department?.name ? <Badge>{service.department.name}</Badge> : null}
                    </div>
                    {service.description ? <p className="mt-3 text-sm leading-6 text-muted">{service.description}</p> : null}
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-muted">Duration</dt>
                        <dd className="font-medium text-foreground">{service.defaultDurationMinutes} min</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Estimated fee</dt>
                        <dd className="font-medium text-foreground">{price(service.defaultPrice)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      <PublicServicesStaticSections />
    </PublicPageShell>
  );
}
