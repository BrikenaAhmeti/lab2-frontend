import { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { hasAnyPermission } from '@/features/auth/utils/permission';
import PharmacyQueueDetail from '@/features/pharmacy/components/PharmacyQueueDetail';
import PharmacyQueueTable from '@/features/pharmacy/components/PharmacyQueueTable';
import {
  pharmacyStatusLabels,
} from '@/features/pharmacy/components/pharmacyFormat';
import {
  getPharmacyApiErrorMessage,
  useDispensePharmacyQueue,
  useFulfillPharmacyQueue,
  usePharmacyQueue,
  usePharmacyQueueItem,
  useStartPharmacyQueue,
} from '@/features/pharmacy/hooks/usePharmacyQueue';
import { enqueueToast } from '@/features/ui/uiSlice';
import type { DispensePharmacyQueuePayload, PharmacyQueueStatusFilter, PharmacyQueueView } from '@/lib/api/pharmacy-api';
import { pharmacyQueueStatusFilters } from '@/lib/api/pharmacy-api';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import CalendarDatePicker from '@/ui/molecules/CalendarDatePicker';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import Pagination from '@/ui/molecules/Pagination';

const statusTabs: Array<{ value: PharmacyQueueStatusFilter; label: string }> = pharmacyQueueStatusFilters.map((status) => ({
  value: status,
  label: pharmacyStatusLabels[statusToViewStatus(status)],
}));

function statusToViewStatus(status: PharmacyQueueStatusFilter) {
  const map = {
    pending: 'PENDING',
    on_hold: 'ON_HOLD',
    in_progress: 'IN_PROGRESS',
    partially_dispensed: 'PARTIALLY_DISPENSED',
    dispensed: 'DISPENSED',
    fulfilled: 'FULFILLED',
    cancelled: 'CANCELLED',
  } as const;

  return map[status];
}

function queueMatchesSearch(queue: PharmacyQueueView, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return [
    queue.patient.name,
    queue.patient.email,
    queue.patient.phone,
    queue.prescription.staff.displayName,
    ...queue.dispensingItems.map((item) => item.prescriptionItem.medicationName),
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(term));
}

function queueMatchesDate(queue: PharmacyQueueView, requestedDate: string) {
  if (!requestedDate) return true;
  return queue.requestedAt.slice(0, 10) === requestedDate;
}

export default function PharmacyDashboardPage() {
  const dispatch = useAppDispatch();
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const canRead = hasAnyPermission(permissions, ['pharmacy:read'], 'any');
  const canDispense = hasAnyPermission(permissions, ['pharmacy:dispense'], 'any');
  const [status, setStatus] = useState<PharmacyQueueStatusFilter>('pending');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [localQueues, setLocalQueues] = useState<Record<string, PharmacyQueueView>>({});
  const [actionError, setActionError] = useState('');

  const listQuery = usePharmacyQueue({ page, limit, status });
  const detailQuery = usePharmacyQueueItem(selectedId);
  const startMutation = useStartPharmacyQueue();
  const dispenseMutation = useDispensePharmacyQueue();
  const fulfillMutation = useFulfillPharmacyQueue();

  const queues = useMemo(
    () => (listQuery.data?.items ?? []).map((queue) => localQueues[queue.id] ?? queue),
    [listQuery.data?.items, localQueues]
  );
  const visibleQueues = useMemo(
    () => queues.filter((queue) => queueMatchesSearch(queue, search) && queueMatchesDate(queue, requestedDate)),
    [queues, requestedDate, search]
  );
  const selectedQueue =
    (selectedId ? localQueues[selectedId] : null) ??
    detailQuery.data ??
    visibleQueues.find((queue) => queue.id === selectedId) ??
    null;

  useEffect(() => {
    const stillVisible = visibleQueues.some((queue) => queue.id === selectedId);
    const nextId = visibleQueues[0]?.id ?? '';

    if (!stillVisible && selectedId !== nextId) {
      setSelectedId(nextId);
    }
  }, [selectedId, visibleQueues]);

  const rememberQueue = (queue: PharmacyQueueView) => {
    setLocalQueues((current) => ({ ...current, [queue.id]: queue }));
    setSelectedId(queue.id);
  };

  const handleStart = async (queue: PharmacyQueueView) => {
    setActionError('');

    try {
      const updatedQueue = await startMutation.mutateAsync(queue.id);
      rememberQueue(updatedQueue);
      dispatch(enqueueToast({ title: 'Queue started', description: updatedQueue.patient.name, variant: 'success' }));
    } catch (error) {
      setActionError(getPharmacyApiErrorMessage(error, 'Pharmacy queue could not be started'));
    }
  };

  const handleSaveDispensing = async (queue: PharmacyQueueView, payload: DispensePharmacyQueuePayload) => {
    setActionError('');

    try {
      const updatedQueue = await dispenseMutation.mutateAsync({ id: queue.id, payload });
      rememberQueue(updatedQueue);
      dispatch(enqueueToast({ title: 'Dispensing saved', description: updatedQueue.patient.name, variant: 'success' }));
    } catch (error) {
      setActionError(getPharmacyApiErrorMessage(error, 'Dispensing could not be saved'));
    }
  };

  const handleFulfill = async (queue: PharmacyQueueView) => {
    setActionError('');

    try {
      const updatedQueue = await fulfillMutation.mutateAsync(queue.id);
      rememberQueue(updatedQueue);
      dispatch(enqueueToast({ title: 'Prescription fulfilled', description: updatedQueue.patient.name, variant: 'success' }));
    } catch (error) {
      setActionError(getPharmacyApiErrorMessage(error, 'Prescription could not be fulfilled'));
    }
  };

  if (!canRead) {
    return <FeedbackMessage type="error" message="You need pharmacy:read permission to view the pharmacy queue." />;
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'Pharmacy', to: '/pharmacy' }, { label: 'Queue' }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pharmacy Queue</h1>
          <p className="mt-1 text-sm text-muted">Review prescriptions, allergies, dispensing, and fulfillment status.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={() => {
            setActionError('');
            listQuery.refetch();
          }}
        >
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
              setSelectedId('');
              setActionError('');
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              status === tab.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
        <Input
          id="pharmacy-queue-search"
          label="Search visible queue"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Patient, doctor, or medication"
        />
        <CalendarDatePicker
          id="pharmacy-requested-date"
          label="Requested date"
          value={requestedDate}
          placeholder="Any requested date"
          onChange={setRequestedDate}
        />
      </div>

      {listQuery.isError ? <FeedbackMessage type="error" message="Pharmacy queue could not be loaded." /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="space-y-4">
          <PharmacyQueueTable
            queues={visibleQueues}
            selectedId={selectedQueue?.id}
            loading={listQuery.isLoading}
            emptyText="No queue items match these filters."
            onSelect={(queue) => {
              setActionError('');
              setSelectedId(queue.id);
            }}
          />

          {listQuery.data ? (
            <Pagination
              page={listQuery.data.meta.page}
              totalPages={listQuery.data.meta.totalPages}
              total={listQuery.data.meta.total}
              limit={listQuery.data.meta.limit}
              loading={listQuery.isFetching}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
            />
          ) : null}
        </div>

        <PharmacyQueueDetail
          queue={selectedQueue}
          loading={Boolean(selectedId) && detailQuery.isLoading}
          canDispense={canDispense}
          actionError={actionError}
          startLoading={startMutation.isPending}
          dispenseLoading={dispenseMutation.isPending}
          fulfillLoading={fulfillMutation.isPending}
          onStart={handleStart}
          onSaveDispensing={handleSaveDispensing}
          onFulfill={handleFulfill}
        />
      </div>
    </div>
  );
}
