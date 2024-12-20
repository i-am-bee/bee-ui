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

import { listAssistants } from '@/app/api/assistants';
import { AssistantsListQuery } from '@/app/api/assistants/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions } from '@tanstack/react-query';
import { Assistant } from '../types';

export const PAGE_SIZE = 6;

export const assistantsQuery = (
  organizationId: string,
  projectId: string,
  params?: AssistantsListQuery,
) =>
  infiniteQueryOptions({
    queryKey: ['assistants', projectId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listAssistants(organizationId, projectId, {
        ...params,
        agent: 'bee',
        limit: params?.limit || PAGE_SIZE,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      const assistants = data.pages
        .flatMap((page) => page?.data)
        .filter(isNotNull)
        .map((item) => decodeEntityWithMetadata<Assistant>(item));
      return {
        assistants,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });
