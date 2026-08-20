"use client";

import { useState, useCallback } from "react";

interface UsePaginationOptions {
  initialPage?:  number;
  initialLimit?: number;
}

interface UsePaginationReturn {
  page:       number;
  limit:      number;
  setPage:    (page: number) => void;
  setLimit:   (limit: number) => void;
  nextPage:   () => void;
  prevPage:   () => void;
  reset:      () => void;
  queryParams: string;
}

export function usePagination({
  initialPage  = 1,
  initialLimit = 10,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page,  setPageState]  = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const setPage  = useCallback((p: number) => setPageState(Math.max(1, p)), []);
  const setLimit = useCallback((l: number) => { setLimitState(l); setPageState(1); }, []);
  const nextPage = useCallback(() => setPageState((p) => p + 1), []);
  const prevPage = useCallback(() => setPageState((p) => Math.max(1, p - 1)), []);
  const reset    = useCallback(() => { setPageState(initialPage); setLimitState(initialLimit); }, [initialPage, initialLimit]);

  const queryParams = `page=${page}&limit=${limit}`;

  return { page, limit, setPage, setLimit, nextPage, prevPage, reset, queryParams };
}
