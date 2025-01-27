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

import { listProjects, readProject } from '@/app/api/projects';
import { ProjectsListQuery } from '@/app/api/projects/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useProjectsQueries() {
  const { organization } = useWorkspace();

  const projectsQueries = useMemo(
    () => ({
      all: () => ['projects'] as const,
      lists: () => [...projectsQueries.all(), 'list'] as const,
      list: (params?: ProjectsListQuery) => {
        const usedParams: ProjectsListQuery = {
          limit: PROJECTS_DEFAULT_PAGE_SIZE,
          order: 'asc',
          order_by: 'created_at',
          ...params,
        };

        return infiniteQueryOptions({
          queryKey: [...projectsQueries.lists(), usedParams],
          queryFn: ({ pageParam }: { pageParam?: string }) =>
            listProjects(organization.id, {
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
            const projects = data.pages
              .flatMap((page) => page?.data)
              .filter(isNotNull);

            return {
              projects,
              totalCount: data.pages.at(0)?.total_count,
            };
          },
          staleTime: 10 * 60 * 1000,
          meta: {
            errorToast: false,
          },
        });
      },
      details: () => [...projectsQueries.all(), 'detail'] as const,
      detail: (id: string) =>
        queryOptions({
          queryKey: [...projectsQueries.details(), id],
          queryFn: () => readProject(organization.id, id),
          staleTime: 10 * 60 * 1000,
        }),
    }),
    [organization.id],
  );

  return projectsQueries;
}

const PROJECTS_DEFAULT_PAGE_SIZE = 10;
