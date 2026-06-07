import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { dismissToast, type ToastMessage } from '@/features/ui/uiSlice';

function ToastCard({ toast }: { toast: ToastMessage }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timeout = window.setTimeout(() => dispatch(dismissToast(toast.id)), 5000);
    return () => window.clearTimeout(timeout);
  }, [dispatch, toast.id]);

  return (
    <li className="rounded-lg border border-border bg-card p-4 text-sm text-foreground shadow-panel">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{toast.title}</p>
          {toast.description && <p className="mt-1 line-clamp-2 text-muted">{toast.description}</p>}
        </div>
        <button
          type="button"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={() => dispatch(dismissToast(toast.id))}
          aria-label="Dismiss notification"
          title="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function ToastViewport() {
  const toasts = useAppSelector((state) => state.ui.toastQueue);

  if (toasts.length === 0) return null;

  return (
    <section
      className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))]"
      aria-label="Toast notifications"
      aria-live="polite"
    >
      <ul className="space-y-3">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </ul>
    </section>
  );
}
