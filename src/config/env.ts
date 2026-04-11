export const env = {
  API_CORE: (import.meta.env.VITE_API_CORE as string) || 'http://localhost:3005',
  API_DEVICE_INFO: import.meta.env.VITE_API_DEVICE_INFO as string
};
