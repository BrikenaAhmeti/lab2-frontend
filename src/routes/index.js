import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/ui/layouts/AppLayout';
import { RequireAuth, RequireFinishedGetStarted } from '@/domain/auth/guards';
// Lazy load pages if you want:
import Login from '@/pages/Auth/login';
import NotFound from '@/pages/NotFound';
// Dashboard pages
import Home from '@/pages/Dashboard/home';
import TransactionsPageRTK from '@/pages/Dashboard/transactions';
import TransactionsPageRQ from '@/pages/Dashboard/transactions/tan-transactions';
export const router = createBrowserRouter([
    {
        element: _jsx(Login, {}),
        path: '/login'
    },
    {
        path: '/transactions',
        element: _jsx(Navigate, { to: "/app/transactions", replace: true })
    },
    {
        path: '/tan-transactions',
        element: _jsx(Navigate, { to: "/app/tan-transactions", replace: true })
    },
    {
        path: '/app',
        element: _jsx(RequireAuth, {}),
        children: [
            {
                element: _jsx(AppLayout, {}),
                children: [
                    {
                        element: _jsx(RequireFinishedGetStarted, {}),
                        children: [
                            { index: true, element: _jsx(Home, {}) },
                            // {
                            //   element: <RequireRole allow={['staff']} />,
                            //   children: [{ path: 'staff/tools', element: <StaffTools /> }]
                            // },
                            // {
                            //   element: <RequireRole allow={['admins', 'staff']} />,
                            //   children: [{ path: 'operations', element: <SharedOps /> }]
                            // },
                            // {
                            //   element: <RequireRole allow={['admins', 'super-admins']} />,
                            //   children: [{ path: 'reports', element: <Reports /> }]
                            // }
                        ]
                    },
                    // { path: 'choose', element: <ChooseSetup /> }
                    { path: 'transactions', element: _jsx(TransactionsPageRTK, {}) },
                    { path: 'tan-transactions', element: _jsx(TransactionsPageRQ, {}) }
                ]
            }
        ]
    },
    {
        path: '/403',
        element: _jsx("div", { className: "p-6", children: "Forbidden" })
    },
    {
        path: '*',
        element: _jsx(NotFound, {})
    },
    {
        path: '/dashboard',
        element: _jsx(Navigate, { to: "/app", replace: true })
    }
]);
