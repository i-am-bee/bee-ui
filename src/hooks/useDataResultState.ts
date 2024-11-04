import { useEffect, useState } from 'react';

export function useDataResultState({
  totalCount,
  isFetching,
  isFiltered,
}: {
  totalCount?: number;
  isFetching?: boolean;
  isFiltered?: boolean;
}) {
  const [isEmptyState, setEmptyState] = useState(false);

  const noResults = totalCount === 0 && !isFetching;
  const isEmpty = isEmptyState && noResults;

  useEffect(() => {
    if (noResults && !isFiltered) setEmptyState(true);
    if (totalCount && totalCount > 0) setEmptyState(false);
  }, [isFiltered, noResults, totalCount]);

  return { noResults, isEmpty };
}
