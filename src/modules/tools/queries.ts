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

import { listTools, readTool } from '@/app/api/tools';
import { Tool, ToolsListQuery } from '@/app/api/tools/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export const TOOLS_DEFAULT_PAGE_SIZE = 20;

export const toolsQuery = (
  organizationId: string,
  projectId: string,
  knowledgeEnabled: boolean,
  params?: ToolsListQuery,
) =>
  infiniteQueryOptions({
    queryKey: ['tools', organizationId, projectId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listTools(organizationId, projectId, {
        limit: TOOLS_DEFAULT_PAGE_SIZE,
        after: pageParam,
        order_by: 'type',
        order: 'asc',
        type: ['code_interpreter', 'system', 'file_search', 'user'],
        ...params,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      return {
        totalCount: data.pages.at(0)?.total_count,
        tools: data.pages
          .flatMap((result) => result?.data ?? [])
          .filter((tool) => knowledgeEnabled || tool.id !== 'file_search')
          .map(decodeEntityWithMetadata<Tool>),
      };
    },
    meta: {
      errorToast: false,
    },
  });

export const readToolQuery = (
  organizationId: string,
  projectId: string,
  id: string,
) =>
  queryOptions({
    queryKey: ['tool', organizationId, projectId, id],
    queryFn: () => readTool(organizationId, projectId, id),
    staleTime: 60 * 60 * 1_000,
    select: (data) => data && decodeEntityWithMetadata<Tool>(data),
  });
