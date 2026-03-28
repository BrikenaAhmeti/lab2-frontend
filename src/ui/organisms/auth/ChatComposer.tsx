import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { sendSignInMessage } from '@/domain/auth/authChat.slice';

export default function ChatComposer() {
  const dispatch = useAppDispatch();
  const { loading, messages } = useAppSelector((s) => s.authChat);
  const [value, setValue] = useState('');

  const canSend = value.trim().length > 0 && !loading && messages.length > 0;

  const onSend = async () => {
    const msg = value.trim();
    if (!msg) return;
    setValue('');
    await dispatch(sendSignInMessage(msg));
  };

  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
        placeholder="Write something…"
        className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend();
        }}
      />
      <button
        onClick={onSend}
        disabled={!canSend}
        className="rounded-2xl px-4 py-3 bg-primary text-primary-foreground disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
