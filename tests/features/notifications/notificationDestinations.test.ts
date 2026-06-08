import { describe, expect, it } from 'vitest';
import { resolveNotificationDestination } from '@/features/notifications/notificationDestinations';
import type { AuthUser } from '@/features/auth/authSlice';
import type { Notification } from '@/features/notifications/notificationTypes';

function user(roles: string[]): AuthUser {
  return {
    id: 'user-1',
    email: 'user@medsphere.test',
    roles,
    permissions: [],
  };
}

function notification(type: string, link: string | null): Notification {
  return {
    id: 'notification-1',
    userId: 'user-1',
    type,
    title: 'Notification',
    message: 'A notification was sent.',
    link,
    channels: ['in_app'],
    isRead: false,
    readAt: null,
    createdAt: '2026-05-18T08:00:00.000Z',
  };
}

describe('resolveNotificationDestination', () => {
  it('keeps public-origin lab links inside the lab dashboard', () => {
    expect(
      resolveNotificationDestination(
        notification('lab.order.created', 'https://medsphere.vercel.app/lab/orders/lab-order-1'),
        user(['Lab Technician'])
      )
    ).toBe('/lab');
  });

  it('falls back from public pages to the notification type destination', () => {
    expect(
      resolveNotificationDestination(
        notification('lab.results.ready', 'https://medsphere.vercel.app/'),
        user(['Patient'])
      )
    ).toBe('/patient/lab-results');
  });

  it('collapses unsupported dashboard detail routes to the page that owns them', () => {
    expect(
      resolveNotificationDestination(
        notification('prescription.created', '/patient/prescriptions/prescription-1'),
        user(['Patient'])
      )
    ).toBe('/patient/prescriptions');

    expect(
      resolveNotificationDestination(
        notification('inventory.low_stock', '/admin/inventory/items/item-1'),
        user(['Admin'])
      )
    ).toBe('/admin/inventory');
  });

  it('routes generic appointment links to the current user portal', () => {
    expect(
      resolveNotificationDestination(
        notification('appointment.booked', '/appointments/appointment-1'),
        user(['Receptionist'])
      )
    ).toBe('/receptionist/appointments');
  });
});
