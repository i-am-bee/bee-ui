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

import { ApiQuery, ApiRequestBody, ApiResponse } from '@/@types/utils';
import { EntityWithDecodedMetadata } from '../types';

export type ThreadsListResponse = ApiResponse<'/v1/threads'>;

export type ThreadResponse = ApiResponse<'/v1/threads/{thread_id}'>;

export type ThreadCreateBody = ApiRequestBody<'/v1/threads'>;

export type ThreadUpdateBody = ApiRequestBody<'/v1/threads/{thread_id}'>;

export type ThreadsListQuery = ApiQuery<'/v1/threads'>;

export interface ThreadMetadata {
  assistantName?: string;
  assistantId?: string;
  title?: string;
  approvedTools?: string[];
}

export type Thread = EntityWithDecodedMetadata<ThreadResponse, ThreadMetadata>;
