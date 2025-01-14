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

import { listAssistants, readAssistant } from '@/app/api/assistants';
import { AssistantsListQuery } from '@/app/api/assistants/types';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { Assistant } from './types';

export function getAssistantsQueries({
  organization,
  project,
}: {
  organization: Organization;
  project: Project;
}) {
  const assistantsQueries = {
    all: () => [project.id, 'assistants'] as const,
    lists: () => [...assistantsQueries.all(), 'list'] as const,
    list: (params?: AssistantsListQuery) => {
      const usedParams: AssistantsListQuery = {
        limit: ASSISTANTS_DEFAULT_PAGE_SIZE,
        agent: 'bee',
        ...params,
      };

      return infiniteQueryOptions({
        queryKey: [...assistantsQueries.lists(), usedParams],
        queryFn: ({ pageParam }: { pageParam?: string }) =>
          listAssistants(organization.id, project.id, {
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
    },
    details: () => [...assistantsQueries.all(), 'detail'] as const,
    detail: (id: string) =>
      queryOptions({
        queryKey: [...assistantsQueries.details(), id],
        queryFn: () => readAssistant(organization.id, project.id, id),
        select: (data) =>
          data ? decodeEntityWithMetadata<Assistant>(data) : null,
        staleTime: 10 * 60 * 1000,
      }),
  };

  return assistantsQueries;
}

export function useAssistantsQueries() {
  const { organization, project } = useAppContext();

  return getAssistantsQueries({ organization, project });
}

export const ASSISTANTS_DEFAULT_PAGE_SIZE = 6;
