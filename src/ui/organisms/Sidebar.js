import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import Button from '@/ui/atoms/Button';
const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/transactions', label: 'Transactions' },
    { to: '/settings', label: 'Settings' },
];
const Sidebar = () => {
    return (_jsxs("aside", { className: "w-64 min-h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between", children: [_jsx("nav", { className: "space-y-2", children: navItems.map((item) => (_jsx(NavLink, { to: item.to, className: ({ isActive }) => `block px-3 py-2 rounded transition-colors ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`, children: item.label }, item.to))) }), _jsx("div", { className: "pt-4 border-t border-gray-200 dark:border-gray-700", children: _jsx(Button, { variant: "secondary", className: "w-full", children: "Logout" }) })] }));
};
export default Sidebar;
