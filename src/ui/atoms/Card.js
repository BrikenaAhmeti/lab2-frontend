import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from "clsx";
export default function Card({ title, subtitle, actions, className, children, ...rest }) {
    return (_jsxs("section", { className: clsx("panel p-5", className), ...rest, children: [(title || subtitle || actions) && (_jsxs("div", { className: "mb-4 flex items-start justify-between gap-3", children: [_jsxs("div", { children: [title && _jsx("h3", { className: "text-base font-semibold text-foreground", children: title }), subtitle && _jsx("p", { className: "mt-1 text-sm text-muted", children: subtitle })] }), actions && _jsx("div", { children: actions })] })), children] }));
}
