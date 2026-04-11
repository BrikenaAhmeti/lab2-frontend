import React from "react";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        // Base
        "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        // Size
        size === "sm" && "text-sm px-3 py-1.5",
        size === "md" && "text-sm px-4 py-2.5",
        size === "lg" && "text-base px-6 py-3",
        // Variants
        variant === "primary" &&
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" &&
          "border-border bg-surface text-foreground hover:bg-surface/80",
        variant === "danger" &&
          "border-transparent bg-danger text-white hover:bg-danger/90",
        variant === "ghost" &&
          "border-transparent bg-transparent text-foreground hover:bg-surface",
        className
      )}
      {...rest}
    >
      {loading && (
        <span
          data-testid="spinner"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span>{rightIcon}</span>}
    </button>
  );
};

export default Button;
