import { useCallback, useEffect, useState } from 'react';

export function usePagination() {
  const [pagination, setPagination] =
    useState<PaginationParams>(PAGINATION_DEFAULT);

  const onNextPage = useCallback(
    (lastItemId?: string) =>
      setPagination(({ page, after }) => ({
        page: after !== lastItemId ? page + 1 : page,
        after: lastItemId,
      })),
    [],
  );

  const onPreviousPage = useCallback(
    (fistItemId?: string) =>
      setPagination(({ page, before }) => ({
        page: page > 1 && before !== fistItemId ? page - 1 : page,
        before: fistItemId,
      })),
    [],
  );

  const reset = () => PAGINATION_DEFAULT;

  return { ...pagination, onNextPage, onPreviousPage, reset };
}

interface PaginationParams {
  page: number;
  after?: string;
  before?: string;
}

const PAGINATION_DEFAULT = { page: 1 };
