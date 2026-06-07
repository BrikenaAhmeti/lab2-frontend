import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Button from '@/ui/atoms/Button';

function errorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return error.statusText || `Request failed with status ${error.status}`;
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      return 'This page could not be loaded from the development server. Refresh after the app finishes restarting.';
    }

    return error.message;
  }

  return 'Something went wrong while loading this page.';
}

export default function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-panel">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground">Page could not be loaded</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{errorMessage(error)}</p>
            <Button type="button" className="mt-5" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
