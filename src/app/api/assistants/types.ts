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
import { FetchParamsOrderBy } from '../utils';

export type AssistantsListResponse = ApiResponse<'/v1/assistants'>;

export type AssistantResponse = ApiResponse<'/v1/assistants/{assistant_id}'>;

export type AssistantDeleteResponse = ApiResponse<
  '/v1/assistants/{assistant_id}',
  'delete'
>;

type AssistantCreateBodyApi = ApiRequestBody<'/v1/assistants', 'post'>;

export type AssistantCreateBody = Omit<
  AssistantCreateBodyApi,
  'tool_resources'
> & {
  tool_resources?: ToolResources;
};

export type AssistantsListQuery = ApiQuery<'/v1/assistants'>;

export type AssistantsListQueryOrderBy =
  FetchParamsOrderBy<AssistantsListQuery>;

export type AssistantModel = AssistantCreateBody['model'];

export type AssistantTool = AssistantResponse['tools'][number];

export type ToolResources = Pick<
  NonNullable<AssistantCreateBodyApi['tool_resources']>,
  'code_interpreter' | 'file_search'
>;
