import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard-api';
import { dashboardActivityParams, dashboardKeys } from './dashboardKeys';

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardApi.stats(),
    refetchInterval: 30000,
    retry: false,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: dashboardKeys.activity(dashboardActivityParams),
    queryFn: () => dashboardApi.activity(dashboardActivityParams),
    staleTime: 15000,
    retry: false,
  });
}
