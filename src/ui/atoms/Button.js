import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
const Button = ({ variant = "primary", size = "md", loading = false, leftIcon, rightIcon, children, className, disabled, ...rest }) => {
    return (_jsxs("button", { disabled: disabled || loading, className: clsx(
        // Base
        "inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60", 
        // Size
        size === "sm" && "text-sm px-3 py-1.5", size === "md" && "text-sm px-4 py-2.5", size === "lg" && "text-base px-6 py-3", 
        // Variants
        variant === "primary" &&
            "border-transparent bg-primary text-primary-foreground hover:bg-primary/90", variant === "secondary" &&
            "border-border bg-surface text-foreground hover:bg-surface/80", variant === "danger" &&
            "border-transparent bg-danger text-white hover:bg-danger/90", variant === "ghost" &&
            "border-transparent bg-transparent text-foreground hover:bg-surface", className), ...rest, children: [loading && (_jsx("span", { "data-testid": "spinner", className: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" })), leftIcon && _jsx("span", { children: leftIcon }), _jsx("span", { children: children }), rightIcon && _jsx("span", { children: rightIcon })] }));
};
export default Button;
