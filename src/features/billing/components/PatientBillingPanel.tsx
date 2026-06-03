import { useState } from 'react';
import { Download } from 'lucide-react';
import { PdfDocumentPanel, PdfInfoGrid, PdfSection } from '@/components/pdf/PdfDocumentPanel';
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
        <PdfDocumentPanel
          key={billing.id}
          documentLabel="Billing Statement PDF"
          title={billing.billingNumber}
          subtitle={billing.patient.name}
          accent={Number(billing.outstandingAmount) > 0 ? 'amber' : 'green'}
          status={<BillingStatusBadge status={billing.status} />}
          actions={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Download size={16} />}
              loading={downloadId === billing.id}
              onClick={() => downloadPdf(billing)}
            >
              Download PDF
            </Button>
          }
          meta={[
            { label: 'Issued', value: formatBillingDate(billing.issuedAt) },
            { label: 'Due', value: formatBillingDate(billing.dueDate) },
            { label: 'Total', value: formatCurrency(Number(billing.totalAmount)) },
            { label: 'Outstanding', value: formatCurrency(Number(billing.outstandingAmount)) },
          ]}
        >
          <PdfSection title="Statement totals" accent="green">
            <PdfInfoGrid
              columns="three"
              items={[
                { label: 'Total', value: formatCurrency(Number(billing.totalAmount)) },
                { label: 'Paid', value: formatCurrency(Number(billing.amountPaid)) },
                { label: 'Outstanding', value: formatCurrency(Number(billing.outstandingAmount)) },
              ]}
            />
          </PdfSection>

          <PdfSection title="Line items" accent="blue">
            {billing.items.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Item</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.items.map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{item.description}</td>
                        <td className="px-3 py-2 text-muted">{item.quantity}</td>
                        <td className="px-3 py-2 text-foreground">{formatCurrency(Number(item.totalPrice))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-surface/50 px-4 py-3 text-sm text-muted">
                No line items listed.
              </div>
            )}
          </PdfSection>
        </PdfDocumentPanel>
      ))}
    </div>
  );
}
