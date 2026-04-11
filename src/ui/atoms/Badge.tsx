import clsx from "clsx";
import type { HTMLAttributes } from "react";

type BadgeVariant = "info" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export default function Badge({
  variant = "neutral",
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variant === "info" && "border-primary/20 bg-primary/10 text-primary",
        variant === "success" && "border-success/20 bg-success/10 text-success",
        variant === "warning" && "border-warning/20 bg-warning/10 text-warning",
        variant === "danger" && "border-danger/20 bg-danger/10 text-danger",
        variant === "neutral" && "border-border bg-surface text-muted",
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
