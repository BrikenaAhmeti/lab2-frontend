import { AxiosError } from 'axios';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import SearchResultsTable from '@/features/search/components/SearchResultsTable';
import { useAdvancedSearch } from '@/features/search/hooks/useAdvancedSearch';
import { useTableFilters } from '@/features/search/hooks/useTableFilters';
import { getSearchResourceConfig, searchResourceConfigs } from '@/features/search/searchConfig';
import type { SearchResource } from '@/lib/api/search-api';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import Pagination from '@/ui/molecules/Pagination';
import SearchFilterBar from '@/ui/molecules/SearchFilterBar';

function canReadSearch(permissions: string[], roles: string[], permission: string) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, [permission], 'any');
}

function apiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }

  return 'Search results could not be loaded';
}

export default function AdvancedSearchPage() {
  const params = useParams<{ resource?: string }>();
  const activeConfig = getSearchResourceConfig(params.resource);
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const filterKeys = activeConfig?.filters.map((field) => field.name) ?? [];
  const tableFilters = useTableFilters({ filterKeys });
  const allowed = activeConfig ? canReadSearch(permissions, roles, activeConfig.permission) : false;
  const searchQuery = useAdvancedSearch<unknown>(
    (activeConfig?.resource ?? 'patients') as SearchResource,
    tableFilters.params,
    Boolean(activeConfig && allowed)
  );

  if (!activeConfig) {
    return <Navigate to="/admin/search/patients" replace />;
  }

  if (!allowed) {
    return <Forbidden />;
  }

  const rows = searchQuery.data?.data ?? [];
  const total = searchQuery.data?.total ?? 0;
  const page = searchQuery.data?.page ?? tableFilters.page;
  const limit = searchQuery.data?.limit ?? tableFilters.limit;
  const totalPages = searchQuery.data?.totalPages ?? 0;
  const loading = searchQuery.isLoading || tableFilters.isDebouncing;

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Advanced Search' }]} />

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Advanced Search</h1>
        <p className="mt-1 text-sm text-muted">Search backend-indexed lists with shareable filters and sorting.</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Search lists">
        {searchResourceConfigs.map((config) => (
          <NavLink
            key={config.resource}
            to={`/admin/search/${config.resource}`}
            className={({ isActive }) =>
              clsx(
                'rounded-xl border px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted hover:bg-surface hover:text-foreground'
              )
            }
          >
            {config.title}
          </NavLink>
        ))}
      </nav>

      <Card title={activeConfig.title} subtitle={activeConfig.subtitle}>
        <div className="space-y-4">
          <SearchFilterBar
            q={tableFilters.q}
            filters={tableFilters.filters}
            fields={activeConfig.filters}
            searchPlaceholder={activeConfig.searchPlaceholder}
            loading={loading || searchQuery.isFetching}
            hasActiveFilters={tableFilters.hasActiveFilters}
            onSearchChange={tableFilters.setQ}
            onFilterChange={tableFilters.setFilter}
            onClear={tableFilters.clearFilters}
          />

          {searchQuery.isError ? <FeedbackMessage type="error" message={apiErrorMessage(searchQuery.error)} /> : null}

          {searchQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading search results...</div>
          ) : null}

          {!searchQuery.isLoading && !searchQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              {activeConfig.emptyText}
            </p>
          ) : null}

          {!searchQuery.isLoading && !searchQuery.isError && rows.length > 0 ? (
            <SearchResultsTable
              rows={rows}
              columns={activeConfig.columns}
              sortBy={tableFilters.sortBy}
              sortOrder={tableFilters.sortOrder}
              onSort={tableFilters.setSort}
            />
          ) : null}

          {!searchQuery.isError ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              loading={searchQuery.isFetching}
              onPageChange={tableFilters.setPage}
              onLimitChange={tableFilters.setLimit}
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
