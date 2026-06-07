import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { PdfDocumentPanel, PdfSection } from '@/components/pdf/PdfDocumentPanel';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { formatCurrency } from '@/utils/formatters/currency';
import type { BillingView, UpdateBillingPayload } from '@/lib/api/billing-api';
import BillingStatusBadge from './BillingStatusBadge';
import {
  canEditBilling,
  canPayBilling,
  dateInputValue,
  formatBillingDate,
  formatBillingDateTime,
  paymentMethodLabels,
} from './billingFormat';

const invoiceIssuer = {
  name: 'MedSphere',
  legalName: 'MedSphere Healthcare Management Platform',
  address: 'Rr. B, Prishtina 10000, Kosovo',
  phone: '+383 44 000 100',
  email: 'billing@medsphere.local',
  businessNumber: '810123456',
  taxNumber: 'TVSH-KS-601234789',
};

interface BillingDetailPanelProps {
  billing: BillingView | null;
  canManage: boolean;
  saving: boolean;
  actionError: string;
  actionMessage: string;
  onSave: (payload: UpdateBillingPayload) => Promise<void>;
  onRecordPayment: () => void;
  onDownloadPdf: (billing: BillingView) => void;
}

export default function BillingDetailPanel({
  billing,
  canManage,
  saving,
  actionError,
  actionMessage,
  onSave,
  onRecordPayment,
  onDownloadPdf,
}: BillingDetailPanelProps) {
  const [taxAmount, setTaxAmount] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitPrice, setItemUnitPrice] = useState('0');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setTaxAmount(String(billing?.taxAmount ?? 0));
    setDiscountAmount(String(billing?.discountAmount ?? 0));
    setDueDate(dateInputValue(billing?.dueDate));
    setNotes(billing?.notes ?? '');
    setItemDescription('');
    setItemQuantity('1');
    setItemUnitPrice('0');
    setLocalError('');
  }, [billing?.id, billing?.taxAmount, billing?.discountAmount, billing?.dueDate, billing?.notes]);

  if (!billing) {
    return (
      <aside className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
        Select a billing record to see line items and payments.
      </aside>
    );
  }

  const editable = canManage && canEditBilling(billing);
  const payable = canManage && canPayBilling(billing);
  const appointmentLabel = billing.appointment
    ? `${billing.appointment.service.name} - ${formatBillingDate(billing.appointment.scheduledAt)}`
    : 'No appointment linked';
  const patientContact = [billing.patient.email, billing.patient.phone].filter(Boolean).join(' | ') || 'No contact on file';
  const invoiceStatusLabel = billing.status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const save = async () => {
    setLocalError('');
    const description = itemDescription.trim();
    const quantity = Number(itemQuantity);
    const unitPrice = Number(itemUnitPrice);

    if (description && (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0)) {
      setLocalError('Manual item quantity and price must be valid numbers.');
      return;
    }

    await onSave({
      taxAmount: Number(taxAmount || 0),
      discountAmount: Number(discountAmount || 0),
      dueDate: dueDate || null,
      notes: notes.trim() || null,
      items: description ? [{ description, quantity, unitPrice }] : undefined,
    });
    setItemDescription('');
    setItemQuantity('1');
    setItemUnitPrice('0');
  };

  return (
    <aside className="space-y-4">
      <PdfDocumentPanel
        documentLabel="Invoice PDF"
        brandName={invoiceIssuer.name}
        issuerDetails={[
          invoiceIssuer.legalName,
          invoiceIssuer.address,
          `${invoiceIssuer.phone} | ${invoiceIssuer.email}`,
        ]}
        title={billing.billingNumber}
        subtitle="Healthcare billing invoice"
        accent={Number(billing.outstandingAmount) > 0 ? 'amber' : 'green'}
        status={<BillingStatusBadge status={billing.status} />}
        actions={
          <Button
            type="button"
            variant="secondary"
            leftIcon={<Download size={16} />}
            onClick={() => onDownloadPdf(billing)}
          >
            Download PDF
          </Button>
        }
        meta={[
          { label: 'Bill to', value: billing.patient.name },
          { label: 'Issued', value: formatBillingDate(billing.issuedAt) },
          { label: 'Due', value: formatBillingDate(billing.dueDate) },
          { label: 'Amount due', value: formatCurrency(Number(billing.outstandingAmount)) },
        ]}
      >
        <PdfSection title="Invoice parties" accent="teal">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface/45 p-4">
              <p className="text-xs font-semibold uppercase text-primary">From</p>
              <h4 className="mt-2 text-base font-semibold text-foreground">{invoiceIssuer.name}</h4>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p>{invoiceIssuer.legalName}</p>
                <p>{invoiceIssuer.address}</p>
                <p>{invoiceIssuer.email}</p>
                <p>{invoiceIssuer.phone}</p>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                <div>
                  <dt className="font-semibold uppercase">Business No.</dt>
                  <dd className="mt-1 text-foreground">{invoiceIssuer.businessNumber}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase">TVSH No.</dt>
                  <dd className="mt-1 text-foreground">{invoiceIssuer.taxNumber}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-primary">Bill to</p>
              <h4 className="mt-2 text-base font-semibold text-foreground">{billing.patient.name}</h4>
              <div className="mt-2 space-y-1 text-sm text-muted">
                <p>{patientContact}</p>
                <p>{appointmentLabel}</p>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                <div>
                  <dt className="font-semibold uppercase">Patient ID</dt>
                  <dd className="mt-1 break-all font-mono text-[11px] leading-5 text-foreground">{billing.patientId}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase">Invoice status</dt>
                  <dd className="mt-1 text-foreground">{invoiceStatusLabel}</dd>
                </div>
              </dl>
            </div>
          </div>
        </PdfSection>

        <PdfSection title="Line items" accent="blue">
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Line item</th>
                  <th className="px-3 py-2 font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Unit</th>
                  <th className="px-3 py-2 font-medium">Tax</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {billing.items.length > 0 ? billing.items.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-medium text-foreground">{item.description}</td>
                    <td className="px-3 py-2 text-muted">{item.quantity}</td>
                    <td className="px-3 py-2 text-muted">{formatCurrency(Number(item.unitPrice))}</td>
                    <td className="px-3 py-2 text-muted">{Number(billing.taxAmount) > 0 ? 'Included' : '0%'}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{formatCurrency(Number(item.totalPrice))}</td>
                  </tr>
                )) : (
                  <tr className="border-t border-border">
                    <td className="px-3 py-5 text-sm text-muted" colSpan={5}>
                      No line items listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PdfSection>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <PdfSection title="Payment terms" accent={Number(billing.outstandingAmount) > 0 ? 'amber' : 'green'}>
            <div className="rounded-lg border border-border bg-surface/45 p-4 text-sm leading-6 text-muted">
              <p>
                Payment is due by {formatBillingDate(billing.dueDate)}. Please include invoice number{' '}
                <span className="font-semibold text-foreground">{billing.billingNumber}</span> with the payment reference.
              </p>
              {billing.notes ? <p className="mt-3">{billing.notes}</p> : null}
            </div>
          </PdfSection>

          <section className="rounded-lg border border-border bg-surface/45 p-4">
            <h4 className="text-sm font-semibold text-foreground">Invoice totals</h4>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ['Subtotal', billing.subtotal],
                ['Tax', billing.taxAmount],
                ['Discount', -Number(billing.discountAmount)],
                ['Total', billing.totalAmount],
                ['Paid', billing.amountPaid],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-foreground">{formatCurrency(Number(value))}</dd>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-border pt-3">
                <dt className="font-semibold text-foreground">Outstanding</dt>
                <dd className="text-lg font-semibold text-primary">{formatCurrency(Number(billing.outstandingAmount))}</dd>
              </div>
            </dl>
          </section>
        </div>
      </PdfDocumentPanel>

      {editable ? (
        <section className="space-y-3 rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Adjust billing</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label htmlFor="billing-tax" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Tax</span>
              <input
                id="billing-tax"
                type="number"
                step="0.01"
                value={taxAmount}
                onChange={(event) => setTaxAmount(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor="billing-discount" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Discount</span>
              <input
                id="billing-discount"
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor="billing-due-date" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Due date</span>
              <input
                id="billing-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor="billing-manual-description" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Manual item</span>
              <input
                id="billing-manual-description"
                value={itemDescription}
                onChange={(event) => setItemDescription(event.target.value)}
                placeholder="Description"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor="billing-manual-quantity" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <input
                id="billing-manual-quantity"
                type="number"
                step="0.01"
                value={itemQuantity}
                onChange={(event) => setItemQuantity(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor="billing-manual-price" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Unit price</span>
              <input
                id="billing-manual-price"
                type="number"
                step="0.01"
                value={itemUnitPrice}
                onChange={(event) => setItemUnitPrice(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label htmlFor="billing-notes" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Notes</span>
              <textarea
                id="billing-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          {localError ? <FeedbackMessage type="error" message={localError} /> : null}
          <Button type="button" loading={saving} onClick={save}>
            Save billing
          </Button>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Payments</h3>
        {billing.payments.length === 0 ? <p className="text-sm text-muted">No payments recorded yet.</p> : null}
        {billing.payments.map((payment) => (
          <div key={payment.id} className="rounded-xl border border-border px-3 py-2 text-sm">
            <p className="font-medium text-foreground">
              {`${formatCurrency(Number(payment.amount))} - ${paymentMethodLabels[payment.paymentMethod]}`}
            </p>
            <p className="mt-1 text-xs text-muted">{formatBillingDateTime(payment.paidAt)}</p>
          </div>
        ))}
      </section>

      {actionError ? <FeedbackMessage type="error" message={actionError} /> : null}
      {actionMessage ? <FeedbackMessage type="success" message={actionMessage} /> : null}

      <div className="flex flex-wrap gap-2">
        {payable ? (
          <Button type="button" onClick={onRecordPayment}>
            Record Payment
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
