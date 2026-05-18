import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import ToastViewport from '@/components/layout/ToastViewport';
import NotificationSocketBridge from '@/features/notifications/NotificationSocketBridge';

export default function App() {
  useAuthBootstrap();
  return (
    <>
      <NotificationSocketBridge />
      <RouterProvider router={router} />
      <ToastViewport />
    </>
  );
}
