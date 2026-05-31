const authApiUrl =
  (import.meta.env.VITE_AUTH_API_URL as string) ||
  (import.meta.env.VITE_API_AUTH_SERVICE as string) ||
  (import.meta.env.VITE_API_CORE as string) ||
  'http://localhost:3005';

const coreApiUrl =
  (import.meta.env.VITE_CORE_API_URL as string) ||
  (import.meta.env.VITE_API_CORE_SERVICE as string) ||
  'http://localhost:3007';

const notificationApiUrl =
  (import.meta.env.VITE_NOTIFICATION_API_URL as string) ||
  (import.meta.env.VITE_API_NOTIFICATION_SERVICE as string) ||
  'http://localhost:3008';

const cmsApiUrl =
  (import.meta.env.VITE_CMS_API_URL as string) ||
  (import.meta.env.VITE_API_CMS_SERVICE as string) ||
  'http://localhost:3009';

const aiApiUrl =
  (import.meta.env.VITE_AI_API_URL as string) ||
  (import.meta.env.VITE_API_AI_SERVICE as string) ||
  'http://localhost:3010';

export const env = {
  API_AUTH: authApiUrl,
  AUTH_API_URL: authApiUrl,
  API_CORE: coreApiUrl,
  CORE_API_URL: coreApiUrl,
  API_DEVICE_INFO: import.meta.env.VITE_API_DEVICE_INFO as string,
  NOTIFICATION_API_URL: notificationApiUrl,
  NOTIFICATION_SOCKET_URL:
    (import.meta.env.VITE_NOTIFICATION_SOCKET_URL as string) ||
    notificationApiUrl,
  CMS_API_URL: cmsApiUrl,
  CMS_SOCKET_URL:
    (import.meta.env.VITE_CMS_SOCKET_URL as string) ||
    cmsApiUrl,
  AI_API_URL: aiApiUrl,
};
