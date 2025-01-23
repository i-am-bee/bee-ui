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

import { listProjectUsers } from '.';
import { paths } from '../schema';

export type ProjectUsersListQuery = NonNullable<
  paths['/v1/organization/projects/{project_id}/users']['get']['parameters']['query']
>;

export type ProjectUsersListResponse = NonNullable<
  Awaited<ReturnType<typeof listProjectUsers>>
>;

export type ProjectUser = ProjectUsersListResponse['data'][number];
export type ProjectUserRole = ProjectUser['role'];

export type ProjectUserCreateBody = NonNullable<
  paths['/v1/organization/projects/{project_id}/users']['post']['requestBody']['content']['application/json']
>;

export type ProjectUserCreateResponse = NonNullable<
  paths['/v1/organization/projects/{project_id}/users']['post']['responses']['200']['content']['application/json']
>;

export type ProjectUserUpdateBody = NonNullable<
  paths['/v1/organization/projects/{project_id}/users/{user_id}']['post']['requestBody']
>['content']['application/json'];
