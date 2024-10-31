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

import { Assistant } from '@/modules/assistants/types';
import { paths } from '../schema';
import { SystemToolId, ToolType } from '../threads-runs/types';
import { FetchParamsOrderBy } from '../utils';
import { EntityWithDecodedMetadata } from '../types';

export type ToolsCreateBody = NonNullable<
  paths['/v1/tools']['post']['requestBody']
>['content']['application/json'];

export type ToolResult = NonNullable<
  paths['/v1/tools/{tool_id}']['get']['responses']['200']['content']['application/json']
>;

export type Tool = EntityWithDecodedMetadata<
  ToolResult,
  {
    description_short?: string;
  }
>;

export type ToolsListQuery = NonNullable<
  paths['/v1/tools']['get']['parameters']['query']
>;

export type ToosListQueryOrderBy = FetchParamsOrderBy<ToolsListQuery>;

export type ToolsListResponse =
  paths['/v1/tools']['get']['responses']['200']['content']['application/json'];

export type ToolsList = ToolsListResponse['data'];

export type SubmitToolOutputsBody =
  paths['/v1/threads/{thread_id}/runs/{run_id}/submit_tool_outputs']['post']['requestBody']['content']['application/json'];

export type SubmitToolOutput = SubmitToolOutputsBody['tool_outputs'][number];

export type SubmitToolApprovalsBody =
  paths['/v1/threads/{thread_id}/runs/{run_id}/submit_tool_approvals']['post']['requestBody']['content']['application/json'];

export type ToolReference =
  | {
      type: 'system';
      id: SystemToolId;
    }
  | {
      type: 'user';
      id: string;
    }
  | {
      type: Exclude<ToolType, 'system' | 'user'>;
    };

export type ToolsUsage = Assistant['tools'];

export type ToolId =
  | Exclude<ToolReference['type'], 'system' | 'user'>
  | SystemToolId;
