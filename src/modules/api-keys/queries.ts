import { listApiKeys } from '@/app/api/api-keys';
import { ApiKeysListQuery } from '@/app/api/api-keys/types';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions } from '@tanstack/react-query';

export const apiKeysQuery = (projectId: string, params?: ApiKeysListQuery) =>
  infiniteQueryOptions({
    queryKey: ['api-keys', projectId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listApiKeys(projectId, {
        after: pageParam,
        order_by: 'created_at',
        order: 'desc',
        ...params,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      const apiKeys = data.pages
        .flatMap((page) => page?.data)
        .filter(isNotNull);
      return {
        apiKeys,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });
