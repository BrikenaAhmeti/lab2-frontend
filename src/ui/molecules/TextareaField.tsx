import clsx from 'clsx';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { id, label, helperText, error, className, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
      <textarea
        ref={ref}
        id={id}
        className={clsx(
          'min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className
        )}
        {...rest}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : helperText ? <p className="text-xs text-muted">{helperText}</p> : null}
    </label>
  );
});

export default TextareaField;
