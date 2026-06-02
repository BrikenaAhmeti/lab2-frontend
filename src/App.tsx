import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import ToastViewport from '@/components/layout/ToastViewport';
import NotificationSocketBridge from '@/features/notifications/NotificationSocketBridge';

export default function App() {
  return (
    <>
      <NotificationSocketBridge />
      <RouterProvider router={router} />
      <ToastViewport />
    </>
  );
}
