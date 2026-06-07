import type { FeedbackStatus, FeedbackView } from '@/lib/api/feedback-api';

export function formatFeedbackDate(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getFeedbackPatientLabel(feedback: FeedbackView) {
  return feedback.isAnonymous ? 'Anonymous patient' : feedback.patient.name || 'Patient';
}

export function getFeedbackAppointmentLabel(feedback: FeedbackView) {
  if (!feedback.appointment) return 'Appointment not available';

  return `${feedback.appointment.service.name} · ${formatFeedbackDate(feedback.appointment.scheduledAt)}`;
}

export function feedbackStatusVariant(status: FeedbackStatus) {
  if (status === 'published') return 'success';
  if (status === 'hidden') return 'neutral';
  return 'warning';
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
