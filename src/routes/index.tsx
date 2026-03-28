import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/ui/layouts/AppLayout';

import { GuestOnly, RequireAuth, RequireFinishedGetStarted, RequireRole } from '@/domain/auth/guards';

// Lazy load pages if you want:
import Login from '@/pages/Auth/login';
import NotFound from '@/pages/NotFound';

// Dashboard pages
import Home from '@/pages/Dashboard/home';
import TransactionsPageRTK from '@/pages/Dashboard/transactions';
import TransactionsPageRQ from '@/pages/Dashboard/transactions/tan-transactions';


export const router = createBrowserRouter([
  {
    element: <Login />,
    path: '/login'
  },
  {
    element: <TransactionsPageRQ />,
    path: '/transactions'
  },
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <RequireFinishedGetStarted />,
            children: [
              { index: true, element: <Home /> },

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
          { path: 'transactions', element: <TransactionsPageRTK /> },
          { path: 'tan-transactions', element: <TransactionsPageRQ /> }
        ]
      }
    ]
  },

  {
    path: '/403',
    element: <div className="p-6">Forbidden</div>
  },
  {
    path: '*',
    element: <NotFound />
  },
  {
    path: '/dashboard',
    element: <Navigate to="/app" replace />
  }
]);
