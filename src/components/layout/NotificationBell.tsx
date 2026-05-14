export default function NotificationBell() {
  return (
    <button
      type="button"
      className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground shadow-soft transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Notifications"
      title="Notifications"
    >
      N
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
    </button>
  );
}
