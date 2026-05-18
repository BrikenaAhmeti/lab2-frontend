export const env = {
  API_CORE: (import.meta.env.VITE_API_CORE as string) || 'http://localhost:3005',
  API_DEVICE_INFO: import.meta.env.VITE_API_DEVICE_INFO as string,
  NOTIFICATION_API_URL:
    (import.meta.env.VITE_NOTIFICATION_API_URL as string) ||
    (import.meta.env.VITE_API_CORE as string) ||
    'http://localhost:3005',
  NOTIFICATION_SOCKET_URL:
    (import.meta.env.VITE_NOTIFICATION_SOCKET_URL as string) ||
    (import.meta.env.VITE_NOTIFICATION_API_URL as string) ||
    (import.meta.env.VITE_API_CORE as string) ||
    'http://localhost:3005',
};
