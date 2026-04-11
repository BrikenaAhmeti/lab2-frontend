import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export default function Input({ id, label, helperText, error, className, ...rest }) {
    return (_jsxs("label", { htmlFor: id, className: "block space-y-1.5", children: [label && _jsx("span", { className: "text-sm font-medium text-foreground", children: label }), _jsx("input", { id: id, className: clsx("w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20", error && "border-danger focus:border-danger focus:ring-danger/20", className), ...rest }), error ? (_jsx("p", { className: "text-xs text-danger", children: error })) : (helperText && _jsx("p", { className: "text-xs text-muted", children: helperText }))] }));
}
