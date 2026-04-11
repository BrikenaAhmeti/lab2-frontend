import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
// Helper: get role (Redux or localStorage)
const getRole = () => {
    const ls = localStorage.getItem('role');
    return ls ?? undefined;
};
// 1) Routes that anyone can access (no guard needed) — but we keep a <PublicGuard/> to redirect logged-in users away from guest-only pages if you want.
export function GuestOnly() {
    const { user, tokens } = useAppSelector(s => s.auth);
    const isAuthed = !!(user || tokens);
    return isAuthed ? _jsx(Navigate, { to: "/app", replace: true }) : _jsx(Outlet, {});
}
// 2) Require logged-in
export function RequireAuth() {
    const { user, tokens } = useAppSelector(s => s.auth);
    const isAuthed = !!(user || tokens);
    const location = useLocation();
    return isAuthed ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
}
// 3) Require specific role(s)
export function RequireRole({ allow }) {
    const { user } = useAppSelector(s => s.auth);
    const role = user?.role || getRole();
    if (!role)
        return _jsx(Navigate, { to: "/login", replace: true });
    return allow.includes(role) ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/403", replace: true });
}
// 4) Optional: “finished setup” guard
export function RequireFinishedGetStarted() {
    const { finishedGetStarted } = useAppSelector(s => s.auth);
    return finishedGetStarted ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/choose", replace: true });
}
