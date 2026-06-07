export function PatientPortalEmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-sm text-muted">
      {children}
    </div>
  );
}

export function PatientPortalLoadingState({ children }: { children: string }) {
  return <div className="rounded-xl border border-border p-4 text-sm text-muted">{children}</div>;
}
