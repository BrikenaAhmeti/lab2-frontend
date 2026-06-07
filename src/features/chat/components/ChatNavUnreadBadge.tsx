import clsx from 'clsx';
import { useChatUnreadCount } from '../useChat';

export default function ChatNavUnreadBadge({ active }: { active: boolean }) {
  const { data: unreadCount = 0 } = useChatUnreadCount();

  if (unreadCount < 1) return null;

  return (
    <span
      className={clsx(
        'ml-auto min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none',
        active ? 'bg-white/20 text-primary-foreground' : 'bg-danger text-white'
      )}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
