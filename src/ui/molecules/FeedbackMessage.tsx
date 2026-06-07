interface FeedbackMessageProps {
  type: 'success' | 'error';
  message: string;
  className?: string;
}

export default function FeedbackMessage({ type, message, className = '' }: FeedbackMessageProps) {
  const tone = type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger';

  return <p className={`rounded-lg px-3 py-2 text-sm ${tone} ${className}`.trim()}>{message}</p>;
}
