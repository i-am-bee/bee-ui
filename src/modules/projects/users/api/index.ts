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

import { listUsers } from '@/app/api/organization-users';
import { UsersListQuery } from '@/app/api/organization-users/types';
import { listProjectUsers, readProjectUser } from '@/app/api/projects-users';
import { ProjectUsersListQuery } from '@/app/api/projects-users/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useProjectUsersQueries() {
  const { organization } = useWorkspace();

  const projectUsersQueries = useMemo(
    () => ({
      all: () => ['project-users'] as const,
      lists: () => [...projectUsersQueries.all(), 'list'] as const,
      list: (id: string, params?: ProjectUsersListQuery) => {
        const usedParams: ProjectUsersListQuery = {
          limit: PROJECT_USERS_DEFAULT_PAGE_SIZE,
          order: 'asc',
          order_by: 'created_at',
          ...params,
        };

        return infiniteQueryOptions({
          queryKey: [...projectUsersQueries.lists(), id, usedParams],
          queryFn: ({ pageParam }: { pageParam?: string }) =>
            listProjectUsers(organization.id, id, {
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
            const users = data.pages
              .flatMap((page) => page?.data)
              .filter(isNotNull);
            return {
              users,
              totalCount: data.pages.at(0)?.total_count,
            };
          },
          meta: {
            errorToast: false,
          },
        });
      },
      details: () => [...projectUsersQueries.all(), 'detail'] as const,
      detail: (projectId: string, userId: string) =>
        queryOptions({
          queryKey: [...projectUsersQueries.details(), projectId, userId],
          queryFn: () => readProjectUser(organization.id, projectId, userId),
          staleTime: 60 * 60 * 1000,
        }),
    }),
    [organization.id],
  );

  return projectUsersQueries;
}

export function useOrganizationUsersQueries() {
  const { organization } = useWorkspace();

  const organizationUsersQueries = useMemo(
    () => ({
      all: () => ['organization-users'] as const,
      lists: () => [...organizationUsersQueries.all(), 'list'] as const,
      list: (params?: UsersListQuery) => {
        const usedParams: UsersListQuery = {
          limit: PROJECT_USERS_DEFAULT_PAGE_SIZE,
          order: 'asc',
          order_by: 'created_at',
          ...params,
        };

        return infiniteQueryOptions({
          queryKey: [...organizationUsersQueries.lists(), usedParams],
          queryFn: ({ pageParam }: { pageParam?: string }) =>
            listUsers(organization.id, {
              ...usedParams,
              after: pageParam,
            }),
          staleTime: 5 * 60 * 1000,
          initialPageParam: undefined,
          getNextPageParam(lastPage) {
            return lastPage?.has_more && lastPage?.last_id
              ? lastPage.last_id
              : undefined;
          },
          select(data) {
            const users = data.pages
              .flatMap((page) => page?.data)
              .filter(isNotNull);
            return {
              users,
              totalCount: data.pages.at(0)?.total_count,
            };
          },
          meta: {
            errorToast: false,
          },
        });
      },
    }),
    [organization.id],
  );

  return organizationUsersQueries;
}

const PROJECT_USERS_DEFAULT_PAGE_SIZE = 10;
