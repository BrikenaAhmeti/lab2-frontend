import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/hooks';

export default function ChatMessageList() {
  const { messages, error } = useAppSelector((s) => s.authChat);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages.length]);

  return (
    <div className="h-[60vh] overflow-auto bg-surface p-4">
      {messages.map((m: any) => {
        if (m.agent) {
          return (
            <div key={m._id} className="flex gap-3 mb-3">
              <img
                alt="agent"
                className="w-9 h-9 rounded-full object-cover border border-border"
                src="/assets/agents/sage-agent-icon.svg"
              />
              <div className="max-w-[85%] rounded-2xl bg-card border border-border px-4 py-3">
                <div className="text-sm leading-relaxed">{m.agent.message}</div>
              </div>
            </div>
          );
        }

        const isPending = m.user?.type === 'pending';
        const isError = m.user?.type === 'error';

        return (
          <div key={m._id} className="flex justify-end mb-3">
            <div
              className={[
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm text-primary-foreground bg-primary',
                isPending ? 'opacity-60' : '',
                isError ? 'border-2 border-danger opacity-70' : '',
              ].join(' ')}
            >
              {m.user.message}
            </div>
          </div>
        );
      })}

      {error && <div className="text-danger text-sm mt-2">{error}</div>}
      <div ref={endRef} />
    </div>
  );
}
