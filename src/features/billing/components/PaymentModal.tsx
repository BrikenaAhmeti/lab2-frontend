import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import { paymentMethods, type PaymentMethod, type RecordPaymentPayload } from '@/lib/api/billing-api';
import { paymentMethodLabels } from './billingFormat';

interface PaymentModalProps {
  open: boolean;
  outstandingAmount: number;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => void;
}

function paymentSchema(outstandingAmount: number) {
  return z.object({
    amount: z.coerce
      .number()
      .finite()
      .positive('Amount must be greater than zero')
      .max(outstandingAmount, 'Amount cannot exceed outstanding balance'),
    paymentMethod: z.enum(paymentMethods),
    referenceNumber: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });
}

type PaymentInputValues = z.input<ReturnType<typeof paymentSchema>>;
type PaymentFormValues = z.output<ReturnType<typeof paymentSchema>>;

export default function PaymentModal({
  open,
  outstandingAmount,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const schema = useMemo(() => paymentSchema(outstandingAmount), [outstandingAmount]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentInputValues, unknown, PaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: outstandingAmount,
      paymentMethod: 'CASH',
      referenceNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: outstandingAmount,
        paymentMethod: 'CASH',
        referenceNumber: '',
        notes: '',
      });
    }
  }, [open, outstandingAmount, reset]);

  if (!open) {
    return null;
  }

  const submit = (values: PaymentFormValues) => {
    onSubmit({
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      referenceNumber: values.referenceNumber?.trim() || null,
      notes: values.notes?.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-lg p-5">
        <h3 className="text-lg font-semibold text-foreground">Record payment</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="payment-amount"
              label="Amount"
              type="number"
              step="0.01"
              disabled={loading}
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />
            <label htmlFor="payment-method" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Payment method</span>
              <select
                id="payment-method"
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('paymentMethod')}
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {paymentMethodLabels[method as PaymentMethod]}
                  </option>
                ))}
              </select>
            </label>
            <Input
              id="payment-reference"
              label="Reference number"
              disabled={loading}
              error={errors.referenceNumber?.message}
              {...register('referenceNumber')}
            />
            <label htmlFor="payment-notes" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Notes</span>
              <textarea
                id="payment-notes"
                disabled={loading}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('notes')}
              />
            </label>
          </div>
          {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save payment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
