import clsx from 'clsx';
import { X } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import Button from '@/ui/atoms/Button';

type ModalWidth = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: ModalWidth;
  onClose: () => void;
}

const widthClasses: Record<ModalWidth, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
};

export default function Modal({
  open,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  onClose,
}: ModalProps) {
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-hidden bg-black/45 p-4"
      aria-labelledby={titleId}
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className={clsx('panel flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden', widthClasses[maxWidth])}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-border bg-surface/55 px-5 py-4">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h3>
            {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="shrink-0 border-t border-border bg-surface/45 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
