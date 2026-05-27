import { FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import Button from '@/ui/atoms/Button';

interface MessageComposerProps {
  disabled?: boolean;
  loading?: boolean;
  onSendText: (content: string) => Promise<unknown>;
  onSendAttachment: (file: File, caption?: string) => Promise<unknown>;
}

export default function MessageComposer({
  disabled = false,
  loading = false,
  onSendText,
  onSendAttachment,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const trimmed = content.trim();
  const canSend = !disabled && !loading && (trimmed.length > 0 || file);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;

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
    <form className="border-t border-border bg-card p-3" onSubmit={submit}>
      {file && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{file.name}</span>
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

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
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
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message..."
          disabled={disabled || loading}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button
          type="submit"
          loading={loading}
          disabled={!canSend}
          className="h-11 w-11 px-0"
          aria-label="Send message"
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
