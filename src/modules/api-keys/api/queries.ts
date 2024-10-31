/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { listApiKeys } from '@/app/api/api-keys';
import { ApiKeysListQuery } from '@/app/api/api-keys/types';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions } from '@tanstack/react-query';

export const apiKeysQuery = (params?: ApiKeysListQuery) =>
  infiniteQueryOptions({
    queryKey: ['api-keys', params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listApiKeys({
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
