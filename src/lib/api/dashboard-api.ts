import type { AxiosInstance } from 'axios';
import { coreApiClient, notificationApiClient } from './axios';
import type {
  DashboardActivity,
  DashboardActivityList,
  DashboardActivityParams,
  DashboardStats,
} from '@/features/dashboard/dashboardTypes';

function coreClient(instance?: AxiosInstance) {
  return instance ?? coreApiClient;
}

function notificationClient(instance?: AxiosInstance) {
  return instance ?? notificationApiClient;
}

export const dashboardApi = {
  stats(instance?: AxiosInstance) {
    return coreClient(instance)
      .get<DashboardStats>('/api/dashboard/stats')
      .then((response) => response.data);
  },
  activity(params: DashboardActivityParams, instance?: AxiosInstance) {
    return notificationClient(instance)
      .get<DashboardActivityList | { data: DashboardActivity[]; meta: DashboardActivityList['meta'] }>(
        '/api/dashboard/activity',
        { params }
      )
      .then((response) => {
        if ('items' in response.data) return response.data;
        return { items: response.data.data, meta: response.data.meta };
      });
  },
};
