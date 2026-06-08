import clsx from 'clsx';

interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  description?: string;
  disabled?: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}

export default function SwitchField({
  id,
  label,
  checked,
  description,
  disabled,
  className,
  onChange,
}: SwitchFieldProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/20',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/40',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border transition',
          checked ? 'border-success bg-success' : 'border-border bg-surface'
        )}
      >
        <span
          className={clsx(
            'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition',
            checked ? 'left-[21px]' : 'left-0.5'
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
      </span>
    </button>
  );
}
