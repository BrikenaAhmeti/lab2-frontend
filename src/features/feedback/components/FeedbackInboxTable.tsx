import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import type { FeedbackStatus, FeedbackView } from '@/lib/api/feedback-api';
import {
  feedbackStatusVariant,
  formatFeedbackDate,
  getFeedbackAppointmentLabel,
  getFeedbackPatientLabel,
  titleCase,
} from './feedbackFormat';

interface FeedbackInboxTableProps {
  rows: FeedbackView[];
  canManage: boolean;
  loading: boolean;
  onUpdate: (id: string, status: Exclude<FeedbackStatus, 'pending'>) => void;
}

type FeedbackRowProps = Omit<FeedbackInboxTableProps, 'rows'> & {
  feedback: FeedbackView;
};

function FeedbackRow({ feedback, canManage, loading, onUpdate }: FeedbackRowProps) {
  return (
    <tr className="border-t border-border align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{`${feedback.rating}/5`}</p>
        <p className="mt-1 text-sm text-muted">{feedback.comment || 'No comment'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{getFeedbackPatientLabel(feedback)}</p>
        <p className="mt-1 text-xs text-muted">{feedback.isAnonymous ? 'Anonymous' : feedback.patient.email ?? '-'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-foreground">{getFeedbackAppointmentLabel(feedback)}</p>
        <p className="mt-1 text-xs text-muted">{feedback.appointment?.staff?.displayName ?? 'Staff member'}</p>
      </td>
      <td className="px-4 py-3 text-sm text-muted">{formatFeedbackDate(feedback.submittedAt)}</td>
      <td className="px-4 py-3">
        <Badge variant={feedbackStatusVariant(feedback.status)}>{titleCase(feedback.status)}</Badge>
      </td>
      {canManage ? (
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={feedback.status === 'published'}
              loading={loading}
              onClick={() => onUpdate(feedback.id, 'published')}
            >
              Publish
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={feedback.status === 'hidden'}
              loading={loading}
              onClick={() => onUpdate(feedback.id, 'hidden')}
            >
              Hide
            </Button>
          </div>
        </td>
      ) : null}
    </tr>
  );
}

export default function FeedbackInboxTable({ rows, canManage, loading, onUpdate }: FeedbackInboxTableProps) {
  return (
    <div className="overflow-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Rating</th>
            <th className="px-4 py-3 font-medium">Patient</th>
            <th className="px-4 py-3 font-medium">Appointment</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage ? <th className="px-4 py-3 font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((feedback) => (
            <FeedbackRow
              key={feedback.id}
              feedback={feedback}
              canManage={canManage}
              loading={loading}
              onUpdate={onUpdate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
