import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import ExportButton from '@/components/export/ExportButton';
import { hasAnyPermission, hasAnyRole, hasPermission } from '@/features/auth/utils/permission';
import { billingApi, type BillingStatus, type BillingView, type RecordPaymentPayload, type UpdateBillingPayload } from '@/lib/api/billing-api';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import Modal from '@/ui/molecules/Modal';
import Pagination from '@/ui/molecules/Pagination';
import { formatCurrency } from '@/utils/formatters/currency';
import BillingDetailPanel from '@/features/billing/components/BillingDetailPanel';
import BillingFilters from '@/features/billing/components/BillingFilters';
import BillingTable from '@/features/billing/components/BillingTable';
import PaymentModal from '@/features/billing/components/PaymentModal';
import {
  dateRangeFromInput,
  getBillingPdfFileName,
  getBillingPeriodRange,
} from '@/features/billing/components/billingFormat';
import {
  getBillingApiErrorMessage,
  useBillingDetail,
  useBillingList,
  useBillingStats,
  useRecordBillingPayment,
  useUpdateBilling,
} from '@/features/billing/hooks/useBillings';

interface BillingPageProps {
  portal: 'admin' | 'receptionist';
}

const defaultPageSize = 10;

function downloadBlob(blob: Blob, billing: BillingView) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getBillingPdfFileName(billing);
  link.click();
  window.URL.revokeObjectURL(url);
}

function SummaryValue({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{formatCurrency(Number(value ?? 0))}</p>
    </div>
  );
}

function canReadBilling(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin', 'Receptionist']) ||
    hasAnyPermission(permissions, ['billing:read', 'billing:read:all'], 'any')
  );
}

export default function BillingPage({ portal }: BillingPageProps) {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const canRead = canReadBilling(permissions, roles);
  const canManage = hasPermission(permissions, 'billing:manage', 'all');
  const root = portal === 'admin' ? '/admin' : '/receptionist';
  const label = portal === 'admin' ? 'Admin' : 'Receptionist';

  const [status, setStatus] = useState<BillingStatus | 'all'>('all');
  const [patientSearch, setPatientSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [selectedId, setSelectedId] = useState('');
  const [paymentBilling, setPaymentBilling] = useState<BillingView | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const listParams = useMemo(
    () => ({
      page,
      limit,
      search: patientSearch.trim() || undefined,
      status: status === 'all' ? undefined : status,
      from: dateRangeFromInput(from, 'start'),
      to: dateRangeFromInput(to, 'end'),
    }),
    [from, limit, page, patientSearch, status, to]
  );
  const todayRange = useMemo(() => getBillingPeriodRange('today'), []);
  const weekRange = useMemo(() => getBillingPeriodRange('week'), []);
  const monthRange = useMemo(() => getBillingPeriodRange('month'), []);

  const billingsQuery = useBillingList(listParams, canRead);
  const detailQuery = useBillingDetail(selectedId);
  const todayStats = useBillingStats(todayRange, canRead);
  const weekStats = useBillingStats(weekRange, canRead);
  const monthStats = useBillingStats(monthRange, canRead);
  const updateMutation = useUpdateBilling();
  const paymentMutation = useRecordBillingPayment();

  const rows = useMemo(() => billingsQuery.data?.items ?? [], [billingsQuery.data?.items]);
  const paginationMeta = billingsQuery.data?.meta;
  const selectedBilling = detailQuery.data ?? rows.find((billing) => billing.id === selectedId) ?? null;

  useEffect(() => {
    setPage(1);
    setSelectedId('');
    setActionError('');
    setActionMessage('');
  }, [from, patientSearch, status, to]);

  useEffect(() => {
    if (paginationMeta && paginationMeta.totalPages > 0 && page > paginationMeta.totalPages) {
      setPage(paginationMeta.totalPages);
    }
  }, [page, paginationMeta]);

  useEffect(() => {
    if (selectedId && rows.length > 0 && !rows.some((billing) => billing.id === selectedId)) {
      setSelectedId('');
    }
  }, [rows, selectedId]);

  if (!canRead) {
    return <Forbidden />;
  }

  const saveBilling = async (payload: UpdateBillingPayload) => {
    if (!selectedBilling) return;
    setActionError('');
    setActionMessage('');

    try {
      await updateMutation.mutateAsync({ id: selectedBilling.id, payload });
      setActionMessage('Billing saved successfully.');
    } catch (error) {
      setActionError(getBillingApiErrorMessage(error, 'Billing could not be saved'));
    }
  };

  const recordPayment = async (payload: RecordPaymentPayload) => {
    if (!paymentBilling) return;
    setPaymentError('');
    setActionError('');
    setActionMessage('');

    try {
      const updated = await paymentMutation.mutateAsync({ id: paymentBilling.id, payload });
      setSelectedId(updated.id);
      setPaymentBilling(null);
      setActionMessage('Payment recorded successfully.');
    } catch (error) {
      setPaymentError(getBillingApiErrorMessage(error, 'Payment could not be recorded'));
    }
  };

  const downloadPdf = async (billing: BillingView) => {
    setActionError('');

    try {
      const pdf = await billingApi.downloadPdf(billing.id);
      downloadBlob(pdf, billing);
    } catch (error) {
      setActionError(getBillingApiErrorMessage(error, 'Billing statement could not be downloaded'));
    }
  };

  const updateLimit = (value: number) => {
    setLimit(value);
    setPage(1);
    setSelectedId('');
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Billing' }]} />

      <Card title="Revenue Summary" subtitle="Paid revenue from MS-29 billing records">
        <div className="grid gap-3 md:grid-cols-3">
          <SummaryValue label="Today" value={todayStats.data?.totalRevenue} />
          <SummaryValue label="This Week" value={weekStats.data?.totalRevenue} />
          <SummaryValue label="This Month" value={monthStats.data?.totalRevenue} />
        </div>
      </Card>

      <Card
        title="Billing"
        subtitle="Manage line items, payments, and patient statements"
        actions={<ExportButton entity="billings" />}
      >
        <div className="space-y-4">
          <BillingFilters
            patientSearch={patientSearch}
            status={status}
            from={from}
            to={to}
            onPatientSearchChange={setPatientSearch}
            onStatusChange={setStatus}
            onFromChange={setFrom}
            onToChange={setTo}
          />

          {billingsQuery.isError ? (
            <FeedbackMessage type="error" message={getBillingApiErrorMessage(billingsQuery.error, 'Billings could not be loaded')} />
          ) : null}

          {todayStats.isError || weekStats.isError || monthStats.isError ? (
            <FeedbackMessage type="error" message="Revenue summary could not be loaded." />
          ) : null}

          {billingsQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading billings...</div> : null}

          {!billingsQuery.isLoading && !billingsQuery.isError && rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              No billing records found.
            </div>
          ) : null}

          {!billingsQuery.isLoading && !billingsQuery.isError && rows.length > 0 ? (
            <BillingTable
              rows={rows}
              selectedId={selectedBilling?.id ?? ''}
              loading={detailQuery.isFetching}
              onSelect={(billing) => {
                setSelectedId(billing.id);
                setActionError('');
                setActionMessage('');
              }}
            />
          ) : null}

          {!billingsQuery.isLoading && !billingsQuery.isError && paginationMeta ? (
            <Pagination
              page={page}
              totalPages={paginationMeta.totalPages}
              total={paginationMeta.total}
              limit={limit}
              loading={billingsQuery.isFetching}
              onPageChange={setPage}
              onLimitChange={updateLimit}
            />
          ) : null}
        </div>
      </Card>

      <PaymentModal
        open={Boolean(paymentBilling)}
        outstandingAmount={Number(paymentBilling?.outstandingAmount ?? 0)}
        loading={paymentMutation.isPending}
        errorMessage={paymentError}
        onClose={() => setPaymentBilling(null)}
        onSubmit={recordPayment}
      />

      <Modal
        open={Boolean(selectedId)}
        title="Billing statement"
        description={selectedBilling ? `${selectedBilling.billingNumber} - ${selectedBilling.patient.name}` : 'Loading billing details'}
        maxWidth="xl"
        onClose={() => {
          setSelectedId('');
          setActionError('');
          setActionMessage('');
        }}
      >
        {detailQuery.isLoading && !selectedBilling ? (
          <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading billing details...</div>
        ) : (
          <BillingDetailPanel
            billing={selectedBilling}
            canManage={canManage}
            saving={updateMutation.isPending}
            actionError={actionError}
            actionMessage={actionMessage}
            onSave={saveBilling}
            onRecordPayment={() => {
              setPaymentError('');
              setPaymentBilling(selectedBilling);
            }}
            onDownloadPdf={downloadPdf}
          />
        )}
      </Modal>
    </div>
  );
}
