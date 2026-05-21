import { useState } from 'react';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { formatCurrency } from '@/utils/formatters/currency';
import { billingApi, type BillingView } from '@/lib/api/billing-api';
import { getBillingApiErrorMessage, useBillingList } from '@/features/billing/hooks/useBillings';
import BillingStatusBadge from './BillingStatusBadge';
import { formatBillingDate } from './billingFormat';

function downloadBlob(blob: Blob, billing: BillingView) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${billing.billingNumber}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function PatientBillingPanel({ patientId }: { patientId: string }) {
  const [downloadId, setDownloadId] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const billingQuery = useBillingList({ page: 1, limit: 50, patientId }, Boolean(patientId));
  const billings = billingQuery.data?.items ?? [];

  const downloadPdf = async (billing: BillingView) => {
    setDownloadId(billing.id);
    setDownloadError('');

    try {
      const pdf = await billingApi.downloadPdf(billing.id);
      downloadBlob(pdf, billing);
    } catch (error) {
      setDownloadError(getBillingApiErrorMessage(error, 'Billing statement could not be downloaded'));
    } finally {
      setDownloadId('');
    }
  };

  return (
    <div className="space-y-3">
      {billingQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading billing history...</div> : null}
      {billingQuery.isError ? (
        <FeedbackMessage type="error" message={getBillingApiErrorMessage(billingQuery.error, 'Billing history could not be loaded')} />
      ) : null}
      {downloadError ? <FeedbackMessage type="error" message={downloadError} /> : null}
      {!billingQuery.isLoading && !billingQuery.isError && billings.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm text-muted">No billing records yet.</div>
      ) : null}
      {billings.map((billing) => (
        <article key={billing.id} className="rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{billing.billingNumber}</p>
              <p className="mt-1 text-sm text-muted">{formatBillingDate(billing.issuedAt)}</p>
            </div>
            <BillingStatusBadge status={billing.status} />
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase text-muted">Total</p>
              <p className="mt-1 text-foreground">{formatCurrency(Number(billing.totalAmount))}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted">Paid</p>
              <p className="mt-1 text-foreground">{formatCurrency(Number(billing.amountPaid))}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted">Outstanding</p>
              <p className="mt-1 text-foreground">{formatCurrency(Number(billing.outstandingAmount))}</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-4"
            loading={downloadId === billing.id}
            onClick={() => downloadPdf(billing)}
          >
            Download PDF
          </Button>
        </article>
      ))}
    </div>
  );
}
