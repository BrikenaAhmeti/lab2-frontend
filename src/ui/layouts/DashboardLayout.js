import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// import LeftSidebar from '@/ui/organisms/LeftSidebar';
// import RightSidebar from '@/ui/organisms/RightSidebar';
// import Topbar from '@/ui/organisms/Topbar';
import { useAppSelector } from '@/app/hooks';
export default function DashboardLayout({ children }) {
    const { user } = useAppSelector(s => s.auth);
    const role = user?.role || localStorage.getItem('role');
    const showRightSidebar = role === 'admins';
    return (_jsx("div", { className: "min-h-screen flex flex-col", children: _jsxs("div", { className: "flex flex-1", children: [_jsx("aside", { className: "hidden md:block w-64 border-r border-gray-200 dark:border-gray-800" }), _jsx("main", { className: "flex-1 p-4 md:p-6", children: children }), showRightSidebar && (_jsx("aside", { className: "hidden lg:block w-80 border-l border-gray-200 dark:border-gray-800" }))] }) }));
}
