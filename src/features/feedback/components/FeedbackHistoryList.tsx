import Badge from '@/ui/atoms/Badge';
import type { FeedbackView } from '@/lib/api/feedback-api';
import {
  feedbackStatusVariant,
  formatFeedbackDate,
  getFeedbackAppointmentLabel,
  titleCase,
} from './feedbackFormat';

export default function FeedbackHistoryList({ items }: { items: FeedbackView[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
        No feedback submitted yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((feedback) => (
        <li key={feedback.id} className="rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{getFeedbackAppointmentLabel(feedback)}</p>
              <p className="mt-1 text-sm text-muted">{formatFeedbackDate(feedback.submittedAt)}</p>
            </div>
            <Badge variant={feedbackStatusVariant(feedback.status)}>{titleCase(feedback.status)}</Badge>
          </div>
          <p className="mt-3 text-sm text-foreground">{`${feedback.rating}/5`}</p>
          {feedback.comment ? <p className="mt-2 text-sm text-muted">{feedback.comment}</p> : null}
        </li>
      ))}
    </ul>
  );
}
