import type { QueryClient } from '@tanstack/react-query';
import { dashboardActivityParams, dashboardKeys } from './dashboardKeys';
import type { DashboardActivity, DashboardActivityList } from './dashboardTypes';

export function activityFromSocketPayload(payload: unknown): DashboardActivity | null {
  if (!payload || typeof payload !== 'object') return null;

  if ('id' in payload && 'description' in payload) {
    return payload as DashboardActivity;
  }

  if ('activity' in payload && payload.activity && typeof payload.activity === 'object') {
    return payload.activity as DashboardActivity;
  }

  if ('data' in payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as DashboardActivity;
  }

  return null;
}

export function addActivityToDashboardCache(queryClient: QueryClient, activity: DashboardActivity) {
  queryClient.setQueryData<DashboardActivityList>(dashboardKeys.activity(dashboardActivityParams), (current) => {
    const currentItems = current?.items ?? [];
    const exists = currentItems.some((item) => item.id === activity.id);
    const items = [activity, ...currentItems.filter((item) => item.id !== activity.id)].slice(0, 20);
    const meta = current?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 };

    return {
      items,
      meta: {
        ...meta,
        total: exists ? meta.total : meta.total + 1,
      },
    };
  });
}
