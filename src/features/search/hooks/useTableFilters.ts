import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SearchParams, SearchSortOrder } from '@/lib/api/search-api';

interface UseTableFiltersOptions {
  filterKeys: string[];
  defaultLimit?: number;
}

function numberParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function cappedLimit(value: string | null, fallback: number) {
  return Math.min(numberParam(value, fallback), 100);
}

export function useTableFilters({ filterKeys, defaultLimit = 10 }: UseTableFiltersOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const [q, setQ] = useState(qParam);
  const [isDebouncing, setIsDebouncing] = useState(false);

  const page = numberParam(searchParams.get('page'), 1);
  const limit = cappedLimit(searchParams.get('limit'), defaultLimit);
  const sortBy = searchParams.get('sortBy') ?? '';
  const sortOrder = (searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc') as SearchSortOrder;

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  const updateParams = useCallback(
    (values: Record<string, string | number | undefined>, resetPage = false) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        Object.entries(values).forEach(([key, value]) => {
          if (value === undefined || value === '') {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        });

        if (resetPage) {
          next.delete('page');
        }

        return next;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    const normalizedQ = q.trim();

    if (normalizedQ === qParam) {
      setIsDebouncing(false);
      return undefined;
    }

    setIsDebouncing(true);
    const timeout = window.setTimeout(() => {
      updateParams({ q: normalizedQ || undefined }, true);
      setIsDebouncing(false);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [q, qParam, updateParams]);

  const filters = useMemo(
    () =>
      filterKeys.reduce<Record<string, string>>((values, key) => {
        values[key] = searchParams.get(key) ?? '';
        return values;
      }, {}),
    [filterKeys, searchParams]
  );

  const params = useMemo<SearchParams>(() => {
    const next: SearchParams = { page, limit };

    if (qParam) {
      next.q = qParam;
    }

    if (sortBy) {
      next.sortBy = sortBy;
      next.sortOrder = sortOrder;
    }

    filterKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        next[key] = value;
      }
    });

    return next;
  }, [filterKeys, limit, page, qParam, searchParams, sortBy, sortOrder]);

  const setFilter = useCallback(
    (key: string, value: string) => {
      if (!filterKeys.includes(key)) return;
      updateParams({ [key]: value || undefined }, true);
    },
    [filterKeys, updateParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      updateParams({ page: nextPage > 1 ? nextPage : undefined });
    },
    [updateParams]
  );

  const setLimit = useCallback(
    (nextLimit: number) => {
      updateParams({ limit: nextLimit === defaultLimit ? undefined : nextLimit }, true);
    },
    [defaultLimit, updateParams]
  );

  const setSort = useCallback(
    (nextSortBy: string) => {
      const nextOrder = sortBy === nextSortBy && sortOrder === 'asc' ? 'desc' : 'asc';
      updateParams({ sortBy: nextSortBy, sortOrder: nextOrder }, true);
    },
    [sortBy, sortOrder, updateParams]
  );

  const clearFilters = useCallback(() => {
    setQ('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      ['q', 'page', 'sortBy', 'sortOrder', ...filterKeys].forEach((key) => next.delete(key));
      return next;
    });
  }, [filterKeys, setSearchParams]);

  const hasActiveFilters = Boolean(qParam || sortBy || filterKeys.some((key) => searchParams.has(key)));

  return {
    q,
    filters,
    params,
    page,
    limit,
    sortBy,
    sortOrder,
    isDebouncing,
    hasActiveFilters,
    setQ,
    setFilter,
    setPage,
    setLimit,
    setSort,
    clearFilters,
  };
}
