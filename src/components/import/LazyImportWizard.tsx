import { Suspense, lazy } from 'react';
import Skeleton from '@/ui/atoms/Skeleton';
import type { ImportWizardProps } from './ImportWizard';

const ImportWizard = lazy(() => import('./ImportWizard'));

function ImportWizardSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
      <section className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-panel">
        <div className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
          <Skeleton className="h-32" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LazyImportWizard(props: ImportWizardProps) {
  if (!props.open) {
    return null;
  }

  return (
    <Suspense fallback={<ImportWizardSkeleton />}>
      <ImportWizard {...props} />
    </Suspense>
  );
}
