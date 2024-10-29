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

import { listThreads, readThread } from '@/app/api/threads';
import {
  Thread,
  ThreadMetadata,
  ThreadsListResponse,
} from '@/app/api/threads/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { isNotNull } from '@/utils/helpers';
import {
  QueryClient,
  infiniteQueryOptions,
  queryOptions,
} from '@tanstack/react-query';

export const PAGE_SIZE = 20;

export function threadsQuery(projectId: string) {
  return infiniteQueryOptions({
    queryKey: ['threads', projectId],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listThreads(projectId, {
        limit: PAGE_SIZE,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      return data.pages
        .flatMap((page) => page?.data)
        .map((item) => {
          if (!item) return null;
          const thread = decodeEntityWithMetadata<Thread>(item);
          return thread.uiMetadata.title ? thread : null;
        })
        .filter(isNotNull);
    },
    meta: {
      errorToast: false,
    },
  });
}

export function prefetchThreads(projectId: string, client: QueryClient) {
  return client.prefetchInfiniteQuery(threadsQuery(projectId));
}

export function lastThreadQuery(projectId: string) {
  return {
    queryKey: ['threads', 'last', projectId],
    queryFn: () =>
      listThreads(projectId, {
        limit: 1,
        order: 'desc',
        order_by: 'created_at',
      }),
    staleTime: 60 * 60 * 1000,
    select: ({ data }: ThreadsListResponse) => {
      const result = data.at(0);
      return result ? decodeEntityWithMetadata<Thread>(result) : undefined;
    },
    meta: {
      errorToast: {
        title: 'Failed to read last session',
        includeErrorMessage: true,
      },
    },
  };
}

export function threadQuery(projectId: string, threadId: string) {
  return queryOptions({
    queryKey: ['thread', projectId, threadId],
    queryFn: () => readThread(projectId, threadId),
    select: (data) => (data ? decodeEntityWithMetadata<Thread>(data) : null),
    meta: {
      errorToast: {
        title: 'Failed to load thread',
        includeErrorMessage: true,
      },
    },
  });
}
