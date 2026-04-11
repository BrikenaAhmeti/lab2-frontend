import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatMoney } from '@/config/currencies';
import { useUsers } from '@/hooks/useUsers';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
const stats = [
    { label: 'Revenue Today', value: formatMoney(12345.67), trend: '+6.2%' },
    { label: 'Appointments', value: '148', trend: '+12' },
    { label: 'Avg. Wait Time', value: '13 min', trend: '-4 min' },
    { label: 'Satisfaction', value: '96.4%', trend: '+1.1%' },
];
const recentActivity = [
    { patient: 'Emma Rivera', event: 'Follow-up completed', status: 'success', time: '8 min ago' },
    { patient: 'Miles Jordan', event: 'Lab review pending', status: 'warning', time: '22 min ago' },
    { patient: 'Nadia Foster', event: 'Billing issue flagged', status: 'danger', time: '36 min ago' },
];
const Home = () => {
    const { data, isLoading, error } = useUsers();
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("section", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", children: stats.map((item) => (_jsxs(Card, { className: "p-4", children: [_jsx("p", { className: "text-sm text-muted", children: item.label }), _jsxs("div", { className: "mt-3 flex items-end justify-between gap-3", children: [_jsx("p", { className: "text-2xl font-semibold tracking-tight text-foreground", children: item.value }), _jsx(Badge, { variant: "info", children: item.trend })] })] }, item.label))) }), _jsxs("section", { className: "grid gap-6 xl:grid-cols-[1.2fr_0.8fr]", children: [_jsx(Card, { title: "Operations Snapshot", subtitle: "Live activity across patient workflows", actions: _jsx(Button, { size: "sm", children: "Export" }), children: _jsx("div", { className: "overflow-hidden rounded-xl border border-border", children: _jsxs("table", { className: "min-w-full text-left text-sm", children: [_jsx("thead", { className: "bg-surface text-muted", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Patient" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Activity" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Time" })] }) }), _jsx("tbody", { children: recentActivity.map((activity) => (_jsxs("tr", { className: "border-t border-border", children: [_jsx("td", { className: "px-4 py-3 font-medium text-foreground", children: activity.patient }), _jsx("td", { className: "px-4 py-3 text-muted", children: activity.event }), _jsx("td", { className: "px-4 py-3", children: _jsx(Badge, { variant: activity.status, children: activity.status }) }), _jsx("td", { className: "px-4 py-3 text-muted", children: activity.time })] }, activity.patient))) })] }) }) }), _jsxs(Card, { title: "Clinical Team", subtitle: "Fetched with TanStack Query", children: [isLoading && _jsx("p", { className: "text-sm text-muted", children: "Loading team members..." }), error && _jsx("p", { className: "text-sm text-danger", children: "Error loading users." }), !isLoading && !error && (_jsx("ul", { className: "space-y-2", children: data?.slice(0, 6).map((u) => (_jsxs("li", { className: "flex items-center justify-between rounded-xl border border-border bg-surface/70 px-3 py-2", children: [_jsx("span", { className: "text-sm font-medium text-foreground", children: u.name }), _jsx(Badge, { variant: "neutral", children: "Online" })] }, u.id))) }))] })] })] }));
};
export default Home;
