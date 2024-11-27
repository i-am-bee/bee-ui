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

import { paths } from '../schema';
import { FetchParamsOrderBy } from '../utils';

export type ListAssistantsResponse =
  paths['/v1/assistants']['get']['responses']['200']['content']['application/json'];

export type AssistantResult =
  paths['/v1/assistants/{assistant_id}']['get']['responses']['200']['content']['application/json'];

type AssistantCreateBodyApi = NonNullable<
  paths['/v1/assistants']['post']['requestBody']
>['content']['application/json'];

export type ToolResources = Pick<
  NonNullable<AssistantCreateBodyApi['tool_resources']>,
  'code_interpreter' | 'file_search'
>;

export type AssistantCreateBody = Omit<
  AssistantCreateBodyApi,
  'tool_resources'
> & {
  tool_resources?: ToolResources;
};

export type AssistantsListQuery = NonNullable<
  paths['/v1/assistants']['get']['parameters']['query']
>;

export type AssistantsListQueryOrderBy =
  FetchParamsOrderBy<AssistantsListQuery>;

export type AssistantModel = AssistantCreateBody['model'];

export type AssistantTool = AssistantResult['tools'][number];
