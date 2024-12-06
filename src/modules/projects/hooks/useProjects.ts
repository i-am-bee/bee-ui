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

import { ProjectsListQuery } from '@/app/api/projects/types';
import { MAX_API_FETCH_LIMIT } from '@/app/api/utils';
import { useUserProfile } from '@/store/user-profile';
import { useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { projectsQuery } from '../queries';
import { ProjectWithScope } from '../types';
import { readProjectUserQuery } from '../users/queries';
import { Organization } from '@/app/api/organization/types';

export function useProjects({
  withRole,
  organization,
}: {
  withRole?: boolean;
  organization: Organization;
}) {
  const userId = useUserProfile((state) => state.id);

  const query = useInfiniteQuery(
    projectsQuery(organization.id, PROJECTS_QUERY_PARAMS),
  );

  const queries = useQueries({
    queries:
      withRole && query.data && userId
        ? query.data.projects.map((project) => {
            return {
              ...readProjectUserQuery(organization.id, project.id, userId),
            };
          })
        : [],
  });

  const projects = useMemo(
    (): ProjectWithScope[] | undefined =>
      queries.length
        ? query.data?.projects.map((project, index) => {
            const projectUser = queries.at(index)?.data;
            return projectUser
              ? { ...project, readOnly: projectUser.role === 'reader' }
              : project;
          })
        : query.data?.projects,
    [queries, query.data?.projects],
  );

  useEffect(() => {
    if (query.hasNextPage && !query.isFetching) {
      query.fetchNextPage();
    }
  }, [query]);

  return { projects, ...query };
}

export const PROJECTS_QUERY_PARAMS: ProjectsListQuery = {
  limit: MAX_API_FETCH_LIMIT,
  order_by: 'created_at',
  order: 'asc',
};
