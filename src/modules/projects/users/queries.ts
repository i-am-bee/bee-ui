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
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

const PAGE_SIZE = 10;

export const readProjectUserQuery = (
  organizationId: string,
  projectId: string,
  userId: string,
) =>
  queryOptions({
    queryKey: ['project-user', organizationId, projectId, userId],
    queryFn: () => readProjectUser(organizationId, projectId, userId),
    staleTime: 60 * 60 * 1000,
  });

export const projectUsersQuery = (
  organizationId: string,
  projectId: string,
  params?: ProjectUsersListQuery,
) =>
  infiniteQueryOptions({
    queryKey: ['project-users', projectId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listProjectUsers(organizationId, projectId, {
        limit: PAGE_SIZE,
        order: 'asc',
        order_by: 'created_at',
        ...params,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      const users = data.pages.flatMap((page) => page?.data).filter(isNotNull);
      return {
        users,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });

export const usersQuery = (organizationId: string, params?: UsersListQuery) =>
  infiniteQueryOptions({
    queryKey: ['organization-users', params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listUsers(organizationId, {
        limit: PAGE_SIZE,
        order: 'asc',
        order_by: 'created_at',
        ...params,
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
      const users = data.pages.flatMap((page) => page?.data).filter(isNotNull);
      return {
        users,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });
