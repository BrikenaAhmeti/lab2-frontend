import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Power, PowerOff, SlidersHorizontal, Stethoscope } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import Input from '@/ui/atoms/Input';
import { TableSkeleton } from '@/ui/atoms/Skeleton';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import FilterSummaryBar, { type FilterSummaryChip } from '@/ui/molecules/FilterSummaryBar';
import OpenHoursFilter from '@/ui/molecules/OpenHoursFilter';
import {
  emptyOpenHoursFilterValue,
  formatOpenHoursFilterSummary,
  isOpenHoursFilterActive,
  openHoursFilterToParams,
} from '@/ui/molecules/OpenHoursFilter.utils';
import Pagination from '@/ui/molecules/Pagination';
import SelectField from '@/ui/molecules/SelectField';
import WorkingHoursSummary from '@/ui/molecules/WorkingHoursSummary';
import DeactivateDepartmentDialog from '@/features/departments/components/DeactivateDepartmentDialog';
import DepartmentDetailsModal from '@/features/departments/components/DepartmentDetailsModal';
import DepartmentFormModal from '@/features/departments/components/DepartmentFormModal';
import {
  emptyDepartmentForm,
  toDepartmentForm,
  toDepartmentPayload,
  validateDepartmentForm,
  type DepartmentForm,
} from '@/features/departments/departmentsForm';
import { normalizeWorkingHours } from '@/features/settings/workingHours';
import {
  departmentsApi,
  type DepartmentRecord,
  type DepartmentSortBy,
  type DepartmentSortDirection,
} from '@/lib/api/departments-api';

type ActiveFilter = 'all' | 'active' | 'inactive';
type DepartmentSortValue = `${DepartmentSortBy}:${DepartmentSortDirection}`;
type FeedbackState = { type: 'success' | 'error'; message: string } | null;
const defaultPageSize = 10;
const defaultSortValue: DepartmentSortValue = 'createdAt:desc';

const departmentsBreadcrumbs = [
  { label: 'Admin', to: '/admin' },
  { label: 'Departments' },
];

const departmentSortOptions: Array<{ value: DepartmentSortValue; label: string }> = [
  { value: 'createdAt:desc', label: 'Latest created' },
  { value: 'createdAt:asc', label: 'Oldest created' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
  { value: 'sortOrder:asc', label: 'Display order' },
];

const actionLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background';

function parseSortValue(value: DepartmentSortValue) {
  const [sortBy, sortDirection] = value.split(':') as [DepartmentSortBy, DepartmentSortDirection];
  return { sortBy, sortDirection };
}

function DepartmentStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'neutral'} className="gap-1.5">
      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-success' : 'bg-muted'}`} aria-hidden="true" />
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [sortValue, setSortValue] = useState<DepartmentSortValue>(defaultSortValue);
  const [openHoursFilter, setOpenHoursFilter] = useState(emptyOpenHoursFilterValue);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRecord | null>(null);
  const [detailsDepartment, setDetailsDepartment] = useState<DepartmentRecord | null>(null);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyDepartmentForm);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const { sortBy, sortDirection } = useMemo(() => parseSortValue(sortValue), [sortValue]);
  const openHoursParams = useMemo(() => openHoursFilterToParams(openHoursFilter), [openHoursFilter]);

  const departmentsQuery = useQuery({
    queryKey: [
      'departments',
      search,
      activeFilter,
      sortValue,
      openHoursFilter,
      page,
      limit,
    ],
    queryFn: () =>
      departmentsApi.list({
        page,
        limit,
        search: search.trim() || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        sortBy,
        sortDirection,
        ...openHoursParams,
      }),
    placeholderData: (previousData) => previousData,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingDepartment
        ? departmentsApi.update(editingDepartment.id, toDepartmentPayload(form))
        : departmentsApi.create(toDepartmentPayload(form)),
    onSuccess: async () => {
      setFeedback({
        type: 'success',
        message: editingDepartment ? 'Department updated successfully.' : 'Department created successfully.',
      });
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeFormModal();
    },
    onError: () => {
      setFormError('Department could not be saved.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (department: DepartmentRecord) =>
      department.isActive
        ? departmentsApi.deactivate(department.id)
        : departmentsApi.update(department.id, { isActive: true }),
    onSuccess: async () => {
      setFeedback({
        type: 'success',
        message: confirmingDeactivate ? 'Department deactivated successfully.' : 'Department activated successfully.',
      });
      setConfirmingDeactivate(null);
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Department status could not be updated.' });
    },
  });

  const rows = useMemo(() => departmentsQuery.data?.items ?? [], [departmentsQuery.data]);
  const paginationMeta = departmentsQuery.data?.meta;

  useEffect(() => {
    if (paginationMeta && paginationMeta.totalPages > 0 && page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta]);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateActiveFilter = (value: ActiveFilter) => {
    setActiveFilter(value);
    setPage(1);
  };

  const updateSortValue = (value: DepartmentSortValue) => {
    setSortValue(value);
    setPage(1);
  };

  const updateOpenHoursFilter = (value: typeof emptyOpenHoursFilterValue) => {
    setOpenHoursFilter(value);
    setPage(1);
  };

  const updateLimit = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setActiveFilter('all');
    setSortValue(defaultSortValue);
    setOpenHoursFilter(emptyOpenHoursFilterValue);
    setPage(1);
  };

  const openCreateModal = () => {
    saveMutation.reset();
    setEditingDepartment(null);
    setForm(emptyDepartmentForm);
    setFormError('');
    setFeedback(null);
    setShowFormModal(true);
  };

  const openEditModal = (department: DepartmentRecord) => {
    saveMutation.reset();
    setEditingDepartment(department);
    setForm(toDepartmentForm(department));
    setFormError('');
    setFeedback(null);
    setShowFormModal(true);
  };

  function closeFormModal() {
    setShowFormModal(false);
    setEditingDepartment(null);
    setForm(emptyDepartmentForm);
    setFormError('');
    saveMutation.reset();
  }

  const saveDepartment = () => {
    setFormError('');
    setFeedback(null);

    const validationError = validateDepartmentForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    saveMutation.mutate();
  };

  const toggleDepartment = (department: DepartmentRecord) => {
    setFeedback(null);
    toggleMutation.reset();

    if (department.isActive) {
      setConfirmingDeactivate(department);
      return;
    }

    toggleMutation.mutate(department);
  };

  const closeDeactivateDialog = () => {
    setConfirmingDeactivate(null);
    toggleMutation.reset();
  };

  const confirmDeactivate = () => {
    if (confirmingDeactivate) {
      toggleMutation.mutate(confirmingDeactivate);
    }
  };

  const filterChips: FilterSummaryChip[] = [];
  const trimmedSearch = search.trim();
  const selectedSortLabel = departmentSortOptions.find((option) => option.value === sortValue)?.label ?? 'Custom';

  if (trimmedSearch) {
    filterChips.push({ id: 'search', label: `Search: ${trimmedSearch}`, onRemove: () => updateSearch('') });
  }

  if (activeFilter !== 'all') {
    filterChips.push({
      id: 'status',
      label: activeFilter === 'active' ? 'Active only' : 'Inactive only',
      onRemove: () => updateActiveFilter('all'),
    });
  }

  if (sortValue !== defaultSortValue) {
    filterChips.push({ id: 'sort', label: `Sort: ${selectedSortLabel}`, onRemove: () => updateSortValue(defaultSortValue) });
  }

  if (isOpenHoursFilterActive(openHoursFilter)) {
    filterChips.push({
      id: 'open-hours',
      label: `Open: ${formatOpenHoursFilterSummary(openHoursFilter)}`,
      onRemove: () => updateOpenHoursFilter(emptyOpenHoursFilterValue),
    });
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs items={departmentsBreadcrumbs} />

      <Card
        title="Departments"
        subtitle="Search, create, and update departments"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
            Add department
          </Button>
        }
      >
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border border-border bg-surface/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  <p className="mt-0.5 text-xs text-muted">Sorted by {selectedSortLabel.toLowerCase()}</p>
                </div>
              </div>
              {departmentsQuery.isFetching ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Updating
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_220px_280px]">
              <Input
                id="department-search"
                label="Search"
                value={search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search departments..."
              />
              <SelectField
                id="department-status-filter"
                label="Status"
                value={activeFilter}
                onChange={(event) => updateActiveFilter(event.target.value as ActiveFilter)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>
              <SelectField
                id="department-sort-filter"
                label="Sort"
                value={sortValue}
                onChange={(event) => updateSortValue(event.target.value as DepartmentSortValue)}
              >
                {departmentSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <OpenHoursFilter
                id="department-open-hours-filter"
                label="Open hours"
                value={openHoursFilter}
                onChange={updateOpenHoursFilter}
              />
            </div>

            <FilterSummaryBar chips={filterChips} onClear={clearFilters} />
          </section>

          {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

          {departmentsQuery.isLoading ? <TableSkeleton rows={5} columns={6} /> : null}

          {departmentsQuery.isError ? (
            <FeedbackMessage type="error" message="Departments could not be loaded." />
          ) : null}

          {!departmentsQuery.isLoading && !departmentsQuery.isError && rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
              <p className="font-medium text-foreground">No departments found</p>
              <p className="mt-1 text-sm text-muted">Create the first department to start organizing services and staff.</p>
            </div>
          ) : null}

          {!departmentsQuery.isLoading && !departmentsQuery.isError && rows.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Department</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold">Hours</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {rows.map((department) => {
                    const hoursRows = normalizeWorkingHours(department.operatingHours);

                    return (
                      <tr key={department.id}>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-foreground">{department.name}</p>
                          {department.description ? <p className="mt-1 max-w-sm text-xs leading-5 text-muted">{department.description}</p> : null}
                        </td>
                        <td className="px-4 py-3 align-top text-muted">
                          <p>{department.floor ? `Floor ${department.floor}` : 'No floor set'}</p>
                          <p className="mt-1 text-xs">{department.phoneExtension ? `Ext. ${department.phoneExtension}` : 'No extension'}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <WorkingHoursSummary rows={hoursRows} limit={2} emptyText="Not set" />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <DepartmentStatusBadge isActive={department.isActive} />
                          <p className="mt-1 text-xs text-muted">{department.isActive ? 'Visible to staff' : 'Hidden from active lists'}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-foreground">{department.sortOrder}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={actionLinkClass}
                              onClick={() => setDetailsDepartment(department)}
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </button>
                            <Link to={`/admin/organization/services?departmentId=${department.id}`} className={actionLinkClass}>
                              <Stethoscope className="h-4 w-4" />
                              Services
                            </Link>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              leftIcon={<Pencil className="h-4 w-4" />}
                              onClick={() => openEditModal(department)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={department.isActive ? 'danger' : 'secondary'}
                              loading={toggleMutation.isPending}
                              leftIcon={
                                department.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />
                              }
                              onClick={() => toggleDepartment(department)}
                            >
                              {department.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {!departmentsQuery.isLoading && !departmentsQuery.isError && paginationMeta ? (
            <Pagination
              page={page}
              totalPages={paginationMeta.totalPages}
              total={paginationMeta.total}
              limit={limit}
              loading={departmentsQuery.isLoading}
              onPageChange={setPage}
              onLimitChange={updateLimit}
            />
          ) : null}
        </div>

        <DepartmentFormModal
          open={showFormModal}
          department={editingDepartment}
          form={form}
          loading={saveMutation.isPending}
          errorMessage={formError}
          onClose={closeFormModal}
          onChange={setForm}
          onSubmit={saveDepartment}
        />

        <DepartmentDetailsModal department={detailsDepartment} onClose={() => setDetailsDepartment(null)} />

        <DeactivateDepartmentDialog
          department={confirmingDeactivate}
          loading={toggleMutation.isPending}
          errorMessage={toggleMutation.isError ? 'Department could not be deactivated.' : ''}
          onClose={closeDeactivateDialog}
          onConfirm={confirmDeactivate}
        />
      </Card>
    </div>
  );
}
