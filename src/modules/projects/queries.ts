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
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

const PAGE_SIZE = 10;

export const projectsQuery = (params?: ProjectsListQuery) =>
  infiniteQueryOptions({
    queryKey: ['projects', params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listProjects({
        ...params,
        limit: params?.limit || PAGE_SIZE,
        order: 'asc',
        order_by: 'created_at',
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

export const readProjectQuery = (id: string) =>
  queryOptions({
    queryKey: ['project', id],
    queryFn: () => readProject(id),
    staleTime: 10 * 60 * 1000,
  });
