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

import { paths } from '@/app/api/schema';

export type Thread = ThreadsListResponse['data'][number];

export type ThreadCreateBody = NonNullable<
  paths['/v1/threads']['post']['requestBody']
>['content']['application/json'];

export interface ThreadMetadata {
  assistantName?: string;
  assistantId?: string;
  title?: string;
  approvedTools?: string[];
}

export type ThreadsListResponse =
  paths['/v1/threads']['get']['responses']['200']['content']['application/json'];

export type ThreadsListQuery = NonNullable<
  paths['/v1/threads']['get']['parameters']['query']
>;

export type ThreadUpdateBody = NonNullable<
  paths['/v1/threads/{thread_id}']['post']['requestBody']
>['content']['application/json'];
