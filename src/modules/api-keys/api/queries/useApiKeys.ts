import { ApiKeysListQuery } from '@/app/api/api-keys/types';
import { useQuery } from '@tanstack/react-query';
import { useApiKeysQueries } from '..';

export function useApiKeys({ params }: { params?: ApiKeysListQuery } = {}) {
  const apiKeysQueries = useApiKeysQueries();

  const query = useQuery(apiKeysQueries.list(params));

  return query;
}
