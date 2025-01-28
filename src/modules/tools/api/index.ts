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
import { useAppContext } from '@/layout/providers/AppProvider';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useToolsQueries() {
  const { organization, project } = useWorkspace();
  const { featureFlags } = useAppContext();

  const toolsQueries = useMemo(
    () => ({
      all: () => [project.id, 'tools'] as const,
      lists: () => [...toolsQueries.all(), 'list'] as const,
      list: (params?: ToolsListQuery) => {
        const usedParams: ToolsListQuery = {
          limit: TOOLS_DEFAULT_PAGE_SIZE,
          order: 'asc',
          order_by: 'type',
          type: ['code_interpreter', 'system', 'file_search', 'user'],
          ...params,
        };

        return infiniteQueryOptions({
          queryKey: [...toolsQueries.lists(), usedParams],
          queryFn: ({ pageParam }: { pageParam?: string }) =>
            listTools(organization.id, project.id, {
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
            return {
              totalCount: data.pages.at(0)?.total_count,
              tools: data.pages
                .flatMap((result) => result?.data ?? [])
                .filter(
                  (tool) => featureFlags.Knowledge || tool.id !== 'file_search',
                )
                .map(decodeEntityWithMetadata<Tool>),
            };
          },
          meta: {
            errorToast: false,
          },
        });
      },
      details: () => [...toolsQueries.all(), 'detail'] as const,
      detail: (id: string) =>
        queryOptions({
          queryKey: [...toolsQueries.details(), id],
          queryFn: () => readTool(organization.id, project.id, id),
          staleTime: 60 * 60 * 1_000,
          select: (data) => data && decodeEntityWithMetadata<Tool>(data),
        }),
    }),
    [organization.id, project.id, featureFlags.Knowledge],
  );

  return toolsQueries;
}

const TOOLS_DEFAULT_PAGE_SIZE = 20;
