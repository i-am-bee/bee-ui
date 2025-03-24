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
import { Assistant } from '@/modules/assistants/types';
import { SystemToolId, ToolType } from '../threads-runs/types';
import { EntityWithDecodedMetadata } from '../types';
import { FetchParamsOrderBy } from '../utils';

export type ToolsListResponse = ApiResponse<'/v1/tools'>;

export type ToolResponse = ApiResponse<'/v1/tools/{tool_id}'>;

export type ToolDeleteResponse = ApiResponse<'/v1/tools/{tool_id}', 'delete'>;

export type ToolCreateBody = ApiRequestBody<'/v1/tools'>;

export type ToolUpdateBody = ApiRequestBody<'/v1/tools/{tool_id}'>;

export type SubmitToolOutputsBody =
  ApiRequestBody<'/v1/threads/{thread_id}/runs/{run_id}/submit_tool_outputs'>;

export type SubmitToolApprovalsBody =
  ApiRequestBody<'/v1/threads/{thread_id}/runs/{run_id}/submit_tool_approvals'>;

export type ToolsListQuery = ApiQuery<'/v1/tools'>;

export type ToosListQueryOrderBy = FetchParamsOrderBy<ToolsListQuery>;

export type Tool = EntityWithDecodedMetadata<
  ToolResponse,
  {
    description_short?: string;
  }
>;

export type ToolsList = ToolsListResponse['data'];

export type SubmitToolOutput = SubmitToolOutputsBody['tool_outputs'][number];

export type ToolReference = (
  | {
      type: 'system';
      id: SystemToolId;
    }
  | {
      type: Exclude<ToolType, 'system'>;
      id: string;
    }
) & { tool?: Tool };

export type ToolsUsage = Assistant['tools'];

export type ToolId =
  | Exclude<ToolReference['type'], 'system' | 'user'>
  | SystemToolId;
