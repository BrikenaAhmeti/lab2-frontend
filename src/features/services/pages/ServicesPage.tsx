import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import {
  getApiErrorMessage,
  toServicePayload,
  useCreateService,
  useDeleteService,
  useDepartmentsOptions,
  useServiceCatalogList,
  useUpdateService,
} from '@/features/services/hooks/useServiceCatalog';
import ServiceCatalogFilters from '@/features/services/components/ServiceCatalogFilters';
import ServiceCatalogTable from '@/features/services/components/ServiceCatalogTable';
import ServiceCatalogFormModal from '@/features/services/components/ServiceCatalogFormModal';
import DeleteServiceDialog from '@/features/services/components/DeleteServiceDialog';
import type { ServiceFormValues } from '@/features/services/services.schemas';
import { hasAnyPermission } from '@/features/auth/utils/permission';
import type { ServiceRecord } from '@/lib/api/services-api';
import Card from '@/ui/atoms/Card';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

type StatusFilter = 'all' | 'active' | 'inactive';
type FeedbackState = { type: 'success' | 'error'; message: string } | null;

const pageSize = 10;

export default function ServicesPage() {
  const { departmentId: routeDepartmentId } = useParams();
  const [searchParams] = useSearchParams();
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const canRead = hasAnyPermission(permissions, ['services:read', 'services:manage', 'services:manage:all'], 'any');
  const canManage = hasAnyPermission(permissions, ['services:manage', 'services:manage:all'], 'any');

  const initialDepartmentId = searchParams.get('departmentId') ?? routeDepartmentId ?? '';
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formError, setFormError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRecord | null>(null);

  const listParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      departmentId: departmentId || undefined,
      isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
    }),
    [activeFilter, departmentId, page, search]
  );

  const servicesQuery = useServiceCatalogList(listParams);
  const departmentsQuery = useDepartmentsOptions();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const rows = servicesQuery.data?.items ?? [];
  const departments = departmentsQuery.data ?? [];
  const totalPages = servicesQuery.data?.meta.totalPages ?? 1;
  const currentPage = servicesQuery.data?.meta.page ?? page;
  const mutationPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    setPage(1);
  }, [search, departmentId, activeFilter]);

  if (!canRead) {
    return <Forbidden />;
  }

  const servicesErrorMessage = servicesQuery.isError
    ? getApiErrorMessage(servicesQuery.error, 'Services could not be loaded')
    : '';

  const openCreateModal = () => {
    setFormError('');
    setEditingService(null);
    setShowFormModal(true);
  };

  const openEditModal = (service: ServiceRecord) => {
    setFormError('');
    setEditingService(service);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setFormError('');
    setEditingService(null);
    setShowFormModal(false);
  };

  const submitForm = async (values: ServiceFormValues) => {
    setFeedback(null);
    setFormError('');

    const payload = toServicePayload(values);

    try {
      if (editingService) {
        await updateMutation.mutateAsync({ id: editingService.id, payload });
        setFeedback({ type: 'success', message: 'Service updated successfully' });
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback({ type: 'success', message: 'Service created successfully' });
      }

      closeFormModal();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Service could not be saved'));
    }
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) {
      return;
    }

    setFeedback(null);
    setDeleteError('');

    try {
      await deleteMutation.mutateAsync(serviceToDelete.id);
      setFeedback({ type: 'success', message: 'Service deleted successfully' });
      setServiceToDelete(null);
    } catch (error) {
      setDeleteError(getApiErrorMessage(error, 'Service could not be deleted'));
    }
  };

  return (
    <Card
      title="Service Catalog"
      subtitle="Manage department services and procedures"
      actions={
        canManage ? (
          <Button onClick={openCreateModal}>
            Add Service
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <ServiceCatalogFilters
          search={search}
          departmentId={departmentId}
          isActive={activeFilter}
          departments={departments}
          onSearchChange={setSearch}
          onDepartmentChange={setDepartmentId}
          onStatusChange={setActiveFilter}
        />

        {feedback ? <FeedbackMessage type={feedback.type} message={feedback.message} /> : null}

        {servicesQuery.isLoading ? (
          <div className="rounded-xl border border-border p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-10 rounded-lg bg-surface" />
              <div className="h-12 rounded-lg bg-surface" />
              <div className="h-12 rounded-lg bg-surface" />
              <div className="h-12 rounded-lg bg-surface" />
            </div>
          </div>
        ) : null}

        {servicesQuery.isError ? <FeedbackMessage type="error" message={servicesErrorMessage} /> : null}

        {!servicesQuery.isLoading && !servicesQuery.isError && rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center">
            <p className="font-medium text-foreground">No services found</p>
            <p className="mt-1 text-sm text-muted">Try adjusting the filters or add a new service.</p>
          </div>
        ) : null}

        {!servicesQuery.isLoading && !servicesQuery.isError && rows.length > 0 ? (
          <>
            <ServiceCatalogTable
              rows={rows}
              departments={departments}
              canManage={canManage}
              mutationPending={mutationPending}
              onEdit={openEditModal}
              onDelete={setServiceToDelete}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{`Page ${currentPage} of ${totalPages}`}</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage <= 1 || servicesQuery.isFetching}
                  onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage >= totalPages || servicesQuery.isFetching}
                  onClick={() => setPage((currentValue) => currentValue + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <ServiceCatalogFormModal
        open={showFormModal}
        departments={departments}
        service={editingService}
        defaultDepartmentId={departmentId}
        loading={createMutation.isPending || updateMutation.isPending}
        submitError={formError}
        onClose={closeFormModal}
        onSubmit={submitForm}
      />

      <DeleteServiceDialog
        service={serviceToDelete}
        errorMessage={deleteError}
        loading={deleteMutation.isPending}
        onClose={() => {
          setDeleteError('');
          setServiceToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
