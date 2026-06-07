import { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import ExportButton from '@/components/export/ExportButton';
import LazyImportWizard from '@/components/import/LazyImportWizard';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import type { EnterLabResultsPayload, LabOrderStatus, LabOrderView } from '@/lib/api/lab-api';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import LabOrderDetail from '@/features/lab/components/LabOrderDetail';
import LabOrderQueue from '@/features/lab/components/LabOrderQueue';
import LabStatsCards from '@/features/lab/components/LabStatsCards';
import { getDateRange, getTodayRange, nextLabStatus, sortLabOrders } from '@/features/lab/components/labFormat';
import {
  getLabApiErrorMessage,
  useEnterLabResults,
  useLabOrders,
  usePendingLabOrders,
  useUpdateLabOrderStatus,
} from '@/features/lab/hooks/useLabOrders';

const queueSections: Array<{ status: LabOrderStatus; title: string; emptyText: string }> = [
  { status: 'PENDING', title: 'Pending', emptyText: 'No pending lab orders.' },
  { status: 'COLLECTED', title: 'Sample Collected', emptyText: 'No collected samples waiting.' },
  { status: 'IN_PROGRESS', title: 'In Progress', emptyText: 'No lab orders in progress.' },
];

function matchesCompletedSearch(order: LabOrderView, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return [
    order.patient.name,
    order.patient.email,
    order.patient.phone,
    order.orderedByStaff.displayName,
    order.department.name,
    ...order.items.map((item) => item.labTest.name),
    ...order.items.map((item) => item.labTest.code),
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(term));
}

export default function LabDashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const today = useMemo(() => getTodayRange(), []);
  const [selectedId, setSelectedId] = useState<string>('');
  const [completedDate, setCompletedDate] = useState(today.date);
  const [completedSearch, setCompletedSearch] = useState('');
  const [localOrders, setLocalOrders] = useState<Record<string, LabOrderView>>({});
  const [actionError, setActionError] = useState('');
  const [showImportWizard, setShowImportWizard] = useState(false);
  const canImportLabTests =
    hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['lab_tests:manage'], 'any');

  const completedRange = useMemo(() => getDateRange(completedDate), [completedDate]);
  const activeQuery = usePendingLabOrders();
  const completedQuery = useLabOrders({
    page: 1,
    limit: 100,
    status: 'completed',
    from: completedRange.from,
    to: completedRange.to,
  });
  const statsQuery = useLabOrders({
    page: 1,
    limit: 100,
    from: today.from,
    to: today.to,
  });
  const statusMutation = useUpdateLabOrderStatus();
  const resultsMutation = useEnterLabResults();

  const activeOrders = useMemo(
    () => (activeQuery.data ?? []).map((order) => localOrders[order.id] ?? order),
    [activeQuery.data, localOrders]
  );
  const completedOrders = useMemo(
    () => (completedQuery.data?.items ?? []).map((order) => localOrders[order.id] ?? order),
    [completedQuery.data?.items, localOrders]
  );
  const visibleCompletedOrders = useMemo(
    () => sortLabOrders(completedOrders.filter((order) => matchesCompletedSearch(order, completedSearch))),
    [completedOrders, completedSearch]
  );
  const allVisibleOrders = useMemo(
    () => [...activeOrders, ...visibleCompletedOrders],
    [activeOrders, visibleCompletedOrders]
  );
  const selectedOrder = allVisibleOrders.find((order) => order.id === selectedId) ?? allVisibleOrders[0] ?? null;

  useEffect(() => {
    if (!selectedId && allVisibleOrders[0]) {
      setSelectedId(allVisibleOrders[0].id);
    }
  }, [allVisibleOrders, selectedId]);

  const openImportWizard = useCallback(() => setShowImportWizard(true), []);
  const closeImportWizard = useCallback(() => setShowImportWizard(false), []);

  const rememberOrder = useCallback((order: LabOrderView) => {
    setLocalOrders((current) => ({ ...current, [order.id]: order }));
    setSelectedId(order.id);
  }, []);

  const handleStatusChange = useCallback(async (order: LabOrderView) => {
    const nextStatus = nextLabStatus(order.status);
    if (!nextStatus) return;

    setActionError('');

    try {
      const updatedOrder = await statusMutation.mutateAsync({ id: order.id, status: nextStatus.status });
      rememberOrder(updatedOrder);
    } catch (error) {
      setActionError(getLabApiErrorMessage(error, 'Lab order status could not be updated'));
    }
  }, [rememberOrder, statusMutation]);

  const handleSaveResults = useCallback(async (order: LabOrderView, payload: EnterLabResultsPayload) => {
    setActionError('');

    try {
      const updatedOrder = await resultsMutation.mutateAsync({ id: order.id, payload });
      rememberOrder(updatedOrder);
    } catch (error) {
      setActionError(getLabApiErrorMessage(error, 'Lab results could not be saved'));
    }
  }, [rememberOrder, resultsMutation]);

  const selectOrder = useCallback((order: LabOrderView) => {
    setActionError('');
    setSelectedId(order.id);
  }, []);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Lab', to: '/lab' }, { label: 'Dashboard' }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lab Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Process lab orders, enter results, and complete the queue.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <ExportButton entity="lab-results" />
          {canImportLabTests ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={openImportWizard}
            >
              Import
            </Button>
          ) : null}
        </div>
      </div>

      <LabStatsCards orders={statsQuery.data?.items ?? []} loading={statsQuery.isLoading} />

      {activeQuery.isError || completedQuery.isError || statsQuery.isError ? (
        <FeedbackMessage type="error" message="Some lab data could not be loaded. Please refresh and try again." />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-4">
          {queueSections.map((section) => (
            <LabOrderQueue
              key={section.status}
              title={section.title}
              orders={sortLabOrders(activeOrders.filter((order) => order.status === section.status))}
              selectedId={selectedOrder?.id}
              loading={activeQuery.isLoading}
              emptyText={section.emptyText}
              onSelect={selectOrder}
            />
          ))}

          <LabOrderQueue
            title="Completed"
            subtitle="Search completed orders by patient, doctor, department, or test."
            orders={visibleCompletedOrders}
            selectedId={selectedOrder?.id}
            loading={completedQuery.isLoading}
            emptyText="No completed lab orders match these filters."
            actions={
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  id="completed-lab-search"
                  label="Search completed"
                  value={completedSearch}
                  onChange={(event) => setCompletedSearch(event.target.value)}
                  placeholder="Patient or test"
                />
                <CalendarDatePicker
                  id="completed-lab-date"
                  label="Completed date"
                  value={completedDate}
                  onChange={(value) => setCompletedDate(value || today.date)}
                />
              </div>
            }
            onSelect={selectOrder}
          />
        </div>

        <LabOrderDetail
          order={selectedOrder}
          actionLoading={statusMutation.isPending}
          resultLoading={resultsMutation.isPending}
          error={actionError}
          onStatusChange={handleStatusChange}
          onSaveResults={handleSaveResults}
        />
      </div>

      <LazyImportWizard
        open={showImportWizard}
        entity="lab-tests"
        title="Import Lab Tests"
        onClose={closeImportWizard}
      />
    </div>
  );
}
