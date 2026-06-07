import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import Button from '@/ui/atoms/Button';

interface MessageComposerProps {
  disabled?: boolean;
  loading?: boolean;
  onSendText: (content: string) => Promise<unknown>;
  onSendAttachment: (file: File, caption?: string) => Promise<unknown>;
  onTypingChange?: (isTyping: boolean) => void;
}

export default function MessageComposer({
  disabled = false,
  loading = false,
  onSendText,
  onSendAttachment,
  onTypingChange,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const trimmed = content.trim();
  const canSend = !disabled && !loading && (trimmed.length > 0 || file);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  }, [onTypingChange]);

  const scheduleTypingStop = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 1200);
  }, [stopTyping]);

  const updateContent = (value: string) => {
    setContent(value);

    if (value.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange?.(true);
      }
      scheduleTypingStop();
      return;
    }

    stopTyping();
  };

  useEffect(() => stopTyping, [stopTyping]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;

    stopTyping();

    if (file) {
      await onSendAttachment(file, trimmed);
    } else {
      await onSendText(trimmed);
    }

    setContent('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form className="border-t border-border bg-card/95 p-3 backdrop-blur" onSubmit={submit}>
      {file && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/80 px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-medium text-foreground">{file.name}</span>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-card hover:text-foreground"
            onClick={() => setFile(null)}
            aria-label="Remove attachment"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-lg border border-border bg-background p-2 shadow-inner">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <textarea
          rows={1}
          value={content}
          onChange={(event) => updateContent(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message..."
          disabled={disabled || loading}
          className="max-h-32 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button
          type="submit"
          loading={loading}
          disabled={!canSend}
          className="h-11 w-11 shrink-0 rounded-lg px-0"
          aria-label="Send message"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
