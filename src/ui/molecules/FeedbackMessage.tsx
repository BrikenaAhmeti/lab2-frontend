interface FeedbackMessageProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  className?: string;
}

export default function FeedbackMessage({ type, message, className = '' }: FeedbackMessageProps) {
  const tone = {
    success: 'bg-success/10 text-success',
    error: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
  }[type];

  return <p className={`rounded-lg px-3 py-2 text-sm ${tone} ${className}`.trim()}>{message}</p>;
}
