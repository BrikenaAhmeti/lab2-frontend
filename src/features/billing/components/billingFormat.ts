import type { AuthUser } from '@/features/auth/authSlice';
import type { BillingStatus, BillingView, PaymentMethod } from '@/lib/api/billing-api';

export const billingStatusLabels: Record<BillingStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};

export const billingStatusTone: Record<BillingStatus, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PARTIALLY_PAID: 'info',
  PAID: 'success',
  CANCELLED: 'neutral',
  OVERDUE: 'danger',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  ONLINE: 'Online',
  OTHER: 'Other',
};

export function formatBillingDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatBillingDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function filenamePart(value?: string | null, fallback = 'billing') {
  const normalized = value
    ?.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

export function getBillingPdfFileName(billing: BillingView) {
  const patient = filenamePart(billing.patient.name, 'patient');
  const date = dateInputValue(billing.issuedAt) || dateInputValue(billing.dueDate) || dateInputValue(billing.createdAt) || 'undated';
  const billingNumber = filenamePart(billing.billingNumber, 'billing');

  return `${patient}-${date}-${billingNumber}.pdf`;
}

export function dateRangeFromInput(value: string, edge: 'start' | 'end') {
  if (!value) return undefined;
  const suffix = edge === 'start' ? 'T00:00:00' : 'T23:59:59.999';
  return new Date(`${value}${suffix}`).toISOString();
}

export function canEditBilling(billing: BillingView) {
  return billing.status !== 'PAID' && billing.status !== 'CANCELLED' && Number(billing.amountPaid) === 0;
}

export function canPayBilling(billing: BillingView) {
  return billing.status !== 'PAID' && billing.status !== 'CANCELLED' && Number(billing.outstandingAmount) > 0;
}

export function resolveBillingPatientId(user: AuthUser | null | undefined) {
  return user?.patientId ?? user?.patientProfileId ?? user?.profileId ?? user?.id ?? '';
}

export function getBillingPeriodRange(period: 'today' | 'week' | 'month') {
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (period === 'week') {
    const day = from.getDay() || 7;
    from.setDate(from.getDate() - day + 1);
  }

  if (period === 'month') {
    from.setDate(1);
  }

  const to = new Date();
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
