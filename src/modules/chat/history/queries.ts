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
import { Thread, ThreadsListQuery } from '@/app/api/threads/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export function useThreadsQueries() {
  const { organization, project } = useAppContext();

  const threadsQueries = {
    all: () => [project.id, 'threads'] as const,
    lists: () => [...threadsQueries.all(), 'list'] as const,
    list: (params?: ThreadsListQuery) => {
      const usedParams = {
        limit: THREADS_DEFAULT_PAGE_SIZE,
        ...params,
      };

      return infiniteQueryOptions({
        queryKey: [...threadsQueries.lists(), usedParams],
        queryFn: ({ pageParam }: { pageParam?: string }) =>
          listThreads(organization.id, project.id, {
            ...usedParams,
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
    },
    // TODO: The thread detail is not used anywhere on the client, so it's probably not necessary.
    details: () => [...threadsQueries.all(), 'detail'] as const,
    detail: (id: string) =>
      queryOptions({
        queryKey: [...threadsQueries.details(), id],
        queryFn: () => readThread(organization.id, project.id, id),
        select: (data) =>
          data ? decodeEntityWithMetadata<Thread>(data) : null,
        meta: {
          errorToast: {
            title: 'Failed to load thread',
            includeErrorMessage: true,
          },
        },
      }),
  };

  return threadsQueries;
}

export const THREADS_DEFAULT_PAGE_SIZE = 20;
