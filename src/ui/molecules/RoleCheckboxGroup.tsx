interface RoleCheckboxGroupProps {
  label: string;
  helperText: string;
  options: string[];
  value: string[];
  error?: string;
  onChange: (next: string[]) => void;
}

export default function RoleCheckboxGroup({
  label,
  helperText,
  options,
  value,
  error,
  onChange,
}: RoleCheckboxGroupProps) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted">{helperText}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((role) => {
          const checked = value.includes(role);
          return (
            <label key={role} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...value, role]
                      : value.filter((item) => item !== role)
                  )
                }
              />
              <span>{role}</span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
