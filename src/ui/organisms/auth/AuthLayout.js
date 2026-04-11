import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AuthHero from './AuthHero';
export default function AuthLayout({ left }) {
    return (_jsx("div", { className: "min-h-screen bg-background text-foreground", children: _jsxs("div", { className: "flex min-h-screen", children: [_jsx("div", { className: "w-full lg:w-1/2 px-6 lg:px-12 py-10 flex flex-col", children: left }), _jsx("div", { className: "hidden lg:block lg:w-1/2", children: _jsx(AuthHero, {}) })] }) }));
}
