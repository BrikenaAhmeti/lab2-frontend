import clsx from 'clsx';
import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { id, label, helperText, error, className, children, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
      <select
        ref={ref}
        id={id}
        className={clsx(
          'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-danger">{error}</p> : helperText ? <p className="text-xs text-muted">{helperText}</p> : null}
    </label>
  );
});

export default SelectField;
