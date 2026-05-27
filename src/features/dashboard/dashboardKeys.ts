import type { DashboardActivityParams } from './dashboardTypes';

export const dashboardActivityParams = { page: 1, limit: 20 } as const;

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (params: DashboardActivityParams) => [...dashboardKeys.all, 'activity', params] as const,
};
