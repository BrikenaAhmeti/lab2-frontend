import { useEffect, useId, useState, type FormEvent } from 'react';
import Button from '@/ui/atoms/Button';
import { formatCurrency } from '@/utils/formatters/currency';
import { paymentMethods, type MarkBillingPaidPayload, type PaymentMethod } from '@/lib/api/billing-api';
import { paymentMethodLabels } from './billingFormat';

interface MarkPaidModalProps {
  open: boolean;
  billingNumber: string;
  patientName: string;
  outstandingAmount: number;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (payload: MarkBillingPaidPayload) => void;
}

export default function MarkPaidModal({
  open,
  billingNumber,
  patientName,
  outstandingAmount,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: MarkPaidModalProps) {
  const titleId = useId();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setPaymentMethod('CASH');
      setReferenceNumber('');
      setNotes('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      paymentMethod,
      referenceNumber: referenceNumber.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="true"
    >
      <div className="panel w-full max-w-lg p-5">
        <h3 id={titleId} className="text-lg font-semibold text-foreground">Mark billing paid</h3>
        <p className="mt-1 text-sm text-muted">
          {billingNumber} - {patientName}
        </p>
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div className="rounded-lg border border-border bg-surface/60 px-3 py-2.5">
            <p className="text-xs font-medium uppercase text-muted">Outstanding balance</p>
            <p className="mt-1 text-base font-semibold text-foreground">{formatCurrency(outstandingAmount)}</p>
          </div>
          <label htmlFor="mark-paid-method" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Payment method</span>
            <select
              id="mark-paid-method"
              value={paymentMethod}
              disabled={loading}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="mark-paid-reference" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Reference number</span>
            <input
              id="mark-paid-reference"
              value={referenceNumber}
              disabled={loading}
              onChange={(event) => setReferenceNumber(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          <label htmlFor="mark-paid-notes" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Notes</span>
            <textarea
              id="mark-paid-notes"
              value={notes}
              disabled={loading}
              rows={3}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
          {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Confirm paid
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
