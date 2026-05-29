import { useQuery } from '@tanstack/react-query';
import {
  advancedSearchApi,
  type SearchListResponse,
  type SearchParams,
  type SearchResource,
} from '@/lib/api/search-api';

export const advancedSearchQueryKey = {
  all: ['advanced-search'] as const,
  list: (resource: SearchResource, params: SearchParams) =>
    [...advancedSearchQueryKey.all, resource, params] as const,
};

export function useAdvancedSearch<T>(resource: SearchResource, params: SearchParams, enabled = true) {
  return useQuery<SearchListResponse<T>>({
    queryKey: advancedSearchQueryKey.list(resource, params),
    queryFn: () => advancedSearchApi.search<T>(resource, params),
    enabled,
    placeholderData: (previous) => previous,
  });
}
