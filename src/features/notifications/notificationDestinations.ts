import type { AuthUser } from '@/features/auth/authSlice';
import {
  getUserRoleNames,
  hasRole,
  resolveUserPortalPath,
} from '@/features/auth/utils/roles';
import type { Notification } from './notificationTypes';

const publicPaths = new Set([
  '/',
  '/public',
  '/about',
  '/departments',
  '/doctors',
  '/services',
  '/book-appointment',
  '/contact',
]);

function roleNames(user?: AuthUser | null) {
  return getUserRoleNames(user);
}

function userHasRole(user: AuthUser | null | undefined, role: string) {
  return hasRole(roleNames(user), role);
}

function cleanPath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const [pathname, suffix = ''] = normalized.split(/([?#].*)/, 2);
  const trimmed = pathname.replace(/\/+$/, '') || '/';

  return `${trimmed}${suffix}`;
}

function pathOnly(path: string) {
  return cleanPath(path).split(/[?#]/, 1)[0];
}

function pathFromLink(link: string) {
  const trimmed = link.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;

  try {
    const url = new URL(trimmed, window.location.origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    return cleanPath(`${url.pathname}${url.search}${url.hash}`);
  } catch {
    return cleanPath(trimmed);
  }
}

function detailIdFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments.at(-1);

  if (!last || ['appointments', 'billing', 'contact', 'items', 'lab-reviews', 'orders', 'prescriptions'].includes(last)) {
    return '';
  }

  return last;
}

function roleAppointmentDestination(user: AuthUser | null | undefined, pathname: string) {
  const appointmentId = detailIdFromPath(pathname);

  if (userHasRole(user, 'Patient')) return '/patient/appointments';
  if (userHasRole(user, 'Receptionist')) return '/receptionist/appointments';
  if (userHasRole(user, 'Doctor')) {
    return appointmentId ? `/doctor/consultations/${appointmentId}` : '/doctor';
  }
  if (userHasRole(user, 'Nurse')) return '/nurse';

  return resolveUserPortalPath(user);
}

function typeDestination(notification: Notification, user: AuthUser | null | undefined, pathname = '') {
  const type = notification.type.toLowerCase();
  const id = detailIdFromPath(pathname);

  if (type.includes('lab')) {
    if (userHasRole(user, 'Patient')) return '/patient/lab-results';
    if (userHasRole(user, 'Doctor')) return id ? `/doctor/lab-reviews/${id}` : '/doctor/lab-reviews';
    return '/lab';
  }

  if (type.includes('appointment')) {
    if (type.includes('completed_report')) return '/patient/medical-records';
    return roleAppointmentDestination(user, pathname);
  }

  if (type.includes('billing') || type.includes('invoice')) {
    if (userHasRole(user, 'Receptionist')) return '/receptionist/billing';
    if (userHasRole(user, 'Admin') || userHasRole(user, 'Super Admin')) return '/admin/billing';
    return '/patient/billing';
  }

  if (type.includes('prescription') || type.includes('pharmacy')) {
    if (userHasRole(user, 'Pharmacist')) return '/pharmacy';
    if (userHasRole(user, 'Doctor')) return '/doctor';
    return '/patient/prescriptions';
  }

  if (type.includes('inventory') || type.includes('stock')) return '/admin/inventory';
  if (type.includes('feedback')) return userHasRole(user, 'Patient') ? '/patient/feedback' : '/doctor/feedback';
  if (type.includes('contact')) return '/admin/contact';
  if (type.includes('chat') || type.includes('message')) return id ? `/messages/${id}` : '/messages';

  return resolveUserPortalPath(user);
}

function supportedDashboardPath(path: string, notification: Notification, user: AuthUser | null | undefined) {
  const pathname = pathOnly(path);

  if (publicPaths.has(pathname) || pathname.startsWith('/public/')) {
    return typeDestination(notification, user, pathname);
  }

  if (pathname === '/dashboard') return resolveUserPortalPath(user);
  if (pathname === '/dashboard/doctor') return '/doctor';
  if (pathname === '/dashboard/nurse') return '/nurse';
  if (pathname === '/dashboard/lab') return '/lab';
  if (pathname === '/dashboard/pharmacy') return '/pharmacy';
  if (pathname === '/dashboard/reception') return '/receptionist';
  if (pathname === '/dashboard/patient') return '/patient';
  if (pathname.startsWith('/dashboard/admin/')) return cleanPath(path.replace(/^\/dashboard\/admin/, '/admin'));
  if (pathname.startsWith('/dashboard/')) return cleanPath(path.replace(/^\/dashboard/, '/admin'));

  if (pathname === '/appointments' || pathname.startsWith('/appointments/')) {
    return roleAppointmentDestination(user, pathname);
  }

  if (pathname === '/doctor/appointments' || pathname.startsWith('/doctor/appointments/')) {
    return roleAppointmentDestination(user, pathname);
  }

  if (pathname === '/admin/appointments' || pathname.startsWith('/admin/appointments/')) {
    return '/admin/search/appointments';
  }

  if (pathname.startsWith('/patient/appointments/')) return '/patient/appointments';
  if (pathname.startsWith('/receptionist/appointments/')) return '/receptionist/appointments';
  if (pathname.startsWith('/admin/billing/')) return '/admin/billing';
  if (pathname.startsWith('/patient/billing/')) return '/patient/billing';
  if (pathname.startsWith('/receptionist/billing/')) return '/receptionist/billing';
  if (pathname.startsWith('/patient/prescriptions/')) return '/patient/prescriptions';
  if (pathname.startsWith('/prescriptions')) return typeDestination(notification, user, pathname);
  if (pathname.startsWith('/doctor/prescriptions')) return '/doctor';
  if (pathname.startsWith('/patient/lab-results/')) return '/patient/lab-results';
  if (pathname.startsWith('/patient/medical-records/')) return '/patient/medical-records';
  if (pathname.startsWith('/lab/orders')) return '/lab';
  if (pathname.startsWith('/admin/inventory/items')) return '/admin/inventory';
  if (pathname.startsWith('/admin/contact/')) return '/admin/contact';
  if (pathname.startsWith('/admin/feedback/')) return '/admin/feedback';

  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/patient' ||
    pathname.startsWith('/patient/') ||
    pathname === '/doctor' ||
    pathname.startsWith('/doctor/') ||
    pathname === '/nurse' ||
    pathname.startsWith('/nurse/') ||
    pathname === '/lab' ||
    pathname.startsWith('/lab/') ||
    pathname === '/pharmacy' ||
    pathname.startsWith('/pharmacy/') ||
    pathname === '/receptionist' ||
    pathname.startsWith('/receptionist/') ||
    pathname === '/messages' ||
    pathname.startsWith('/messages/')
  ) {
    return path;
  }

  return typeDestination(notification, user, pathname);
}

export function resolveNotificationDestination(
  notification: Notification,
  user?: AuthUser | null,
) {
  const link = notification.link?.trim();
  if (!link) return null;

  const path = pathFromLink(link);
  if (!path) return null;

  return supportedDashboardPath(path, notification, user);
}
