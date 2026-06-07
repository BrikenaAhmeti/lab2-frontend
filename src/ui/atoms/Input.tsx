import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helperText,
    error,
    className,
    ...rest
  },
  ref
) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={clsx(
          "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        helperText && <p className="text-xs text-muted">{helperText}</p>
      )}
    </label>
  );
});

export default Input;
