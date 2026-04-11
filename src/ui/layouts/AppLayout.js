import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import ThemeToggle from '@/ui/molecules/ThemeToggle';
import LanguageSwitch from '@/ui/molecules/LanguageSwitch';
import { useAppSelector } from '@/app/hooks';
const navItems = [
    { to: '/app', label: 'Overview' },
    { to: '/app/transactions', label: 'Transactions' },
    { to: '/app/tan-transactions', label: 'Live Query' },
];
export default function AppLayout() {
    const { user } = useAppSelector((s) => s.auth);
    const role = user?.role || localStorage.getItem('role') || 'admin';
    return (_jsx("div", { className: "min-h-screen bg-transparent", children: _jsxs("div", { className: "mx-auto flex min-h-screen max-w-[1600px]", children: [_jsxs("aside", { className: "hidden w-72 shrink-0 border-r border-border bg-card/90 p-5 backdrop-blur-xl lg:block", children: [_jsxs("div", { className: "mb-8 flex items-center gap-3", children: [_jsx("img", { src: "/medsphere.png", alt: "MedSphere", className: "h-11 w-11 rounded-xl object-cover" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-semibold tracking-wide text-foreground", children: "MedSphere" }), _jsx("p", { className: "text-xs text-muted", children: "Healthcare Operations" })] })] }), _jsx("nav", { className: "space-y-2", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, end: item.to === '/app', className: ({ isActive }) => clsx('block rounded-xl px-3 py-2 text-sm transition', isActive
                                    ? 'bg-primary text-primary-foreground shadow-soft'
                                    : 'text-muted hover:bg-surface hover:text-foreground'), children: item.label }, item.to))) }), _jsxs("div", { className: "mt-8 panel bg-surface p-4", children: [_jsx("p", { className: "text-xs font-medium uppercase tracking-[0.16em] text-muted", children: "Active Role" }), _jsx("p", { className: "mt-2 text-sm font-semibold capitalize text-foreground", children: role })] })] }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col", children: [_jsx("header", { className: "sticky top-0 z-10 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl md:px-6", children: _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted", children: "Dashboard" }), _jsxs("h1", { className: "text-xl font-semibold text-foreground", children: ["Good evening, ", user?.name ?? 'Team'] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(LanguageSwitch, {}), _jsx(ThemeToggle, {})] })] }) }), _jsx("main", { className: "flex-1 p-4 md:p-6", children: _jsx(Outlet, {}) })] })] }) }));
}
