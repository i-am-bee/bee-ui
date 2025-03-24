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
import { MessageFeedback } from '../threads-messages/types';
import { EntityWithDecodedMetadata } from '../types';

export type RunsListResponse = ApiResponse<'/v1/threads/{thread_id}/runs'>;

export type RunResponse = ApiResponse<'/v1/threads/{thread_id}/runs/{run_id}'>;

export type RunCreateResponse = ApiResponse<
  '/v1/threads/{thread_id}/runs',
  'post',
  'text/event-stream'
>;

export type RunUpdateResponse = ApiResponse<
  '/v1/threads/{thread_id}/runs/{run_id}',
  'post'
>;

export type RunStepsListResponse =
  ApiResponse<'/v1/threads/{thread_id}/runs/{run_id}/steps'>;

export type RunStepResponse =
  ApiResponse<'/v1/threads/{thread_id}/runs/{run_id}/steps/{step_id}'>;

export type RunCreateBody = ApiRequestBody<'/v1/threads/{thread_id}/runs'>;

export type RunUpdateBody =
  ApiRequestBody<'/v1/threads/{thread_id}/runs/{run_id}'>;

export type RunsListQuery = ApiQuery<'/v1/threads/{thread_id}/runs'>;

export type RunStepsListQuery =
  ApiQuery<'/v1/threads/{thread_id}/runs/{run_id}/steps'>;

export type RunMetadata = {
  feedback?: MessageFeedback;
  resources?: {
    thread?: { vectorStoreId: string };
    assistant?: { vectorStoreId: string };
  };
};

export type Run = EntityWithDecodedMetadata<RunResponse, RunMetadata>;

export type RunCreateResponseEvent = RunCreateResponse['event'];

export const RUN_EVENT_NAMES = [
  'thread.run.created',
  'thread.run.queued',
  'thread.run.in_progress',
  'thread.run.requires_action',
  'thread.run.completed',
  'thread.run.incomplete',
  'thread.run.failed',
  'thread.run.cancelling',
  'thread.run.cancelled',
  'thread.run.expired',
] as const satisfies RunCreateResponseEvent[];

type RunEventName = (typeof RUN_EVENT_NAMES)[number];

export const RUN_STEP_EVENT_NAMES = [
  'thread.run.step.created',
  'thread.run.step.in_progress',
  'thread.run.step.completed',
  'thread.run.step.failed',
  'thread.run.step.cancelled',
  'thread.run.step.expired',
] as const satisfies RunCreateResponseEvent[];

type RunStepEventName = (typeof RUN_STEP_EVENT_NAMES)[number];

export type RunEventResponse = RunCreateResponse & {
  event: RunEventName;
};

export type RunStepEventResponse = RunCreateResponse & {
  event: RunStepEventName;
  data: NonNullable<RunCreateResponse['data']>;
};

export type RunEventRequiresAction = RunEventResponse & {
  event: 'thread.run.requires_action';
};

export type RequiredAction = NonNullable<
  RunEventRequiresAction['data']
>['required_action'];

export type RequiredActionToolOutput = RequiredAction & {
  type: 'submit_tool_outputs';
};

export type RequiredActionToolApprovals = RequiredAction & {
  type: 'submit_tool_approvals';
};

export type RunStepDeltaEventResponse = RunCreateResponse & {
  event: 'thread.run.step.delta';
};

export type MessageDeltaEventResponse = RunCreateResponse & {
  event: 'thread.message.delta';
};

export type MessageCreatedEventResponse = RunCreateResponse & {
  event: 'thread.message.created';
};

export type MessageCompletedEventResponse = RunCreateResponse & {
  event: 'thread.message.completed';
};

export type RunStepEventResponseDetail = NonNullable<
  RunStepEventResponse['data']
>['step_details'];

export type RunStepEventResponseDetailToolCall = RunStepEventResponseDetail & {
  type: 'tool_calls';
};
export type ResponseToolCall =
  RunStepEventResponseDetailToolCall['tool_calls'][number];

export type ToolType = ResponseToolCall['type'];

export type RunStepDeltaEventDetails = NonNullable<
  RunStepDeltaEventResponse['data']
>['delta']['step_details'];

export type RunStepDeltaEventDetailsThought = RunStepDeltaEventDetails & {
  type: 'thought';
};

export type ToolApprovals = RunCreateBody['tool_approvals'];

export type SystemToolCall = Extract<
  ResponseToolCall,
  {
    type: 'system';
  }
>;

export type SystemToolId = SystemToolCall['system']['id'];

export interface SystemToolResult {
  input?: unknown;
  id: SystemToolId;
  output?: unknown;
}

export interface WebSearchToolResult extends SystemToolResult {
  id: 'web_search';
  input: string;
  output?: {
    title?: string;
    description?: string;
    url?: string;
  }[];
}

export interface WikipediaToolResult extends SystemToolResult {
  id: 'wikipedia';
  input: string;
  output?: {
    document?: {
      text?: string;
      title?: string;
      description?: string;
      url?: string;
    };
    title?: string;
    description?: string;
    url?: string;
  }[];
}

export interface ArXivToolResult extends SystemToolResult {
  id: 'arxiv';
  input: object;
  output?: {
    entries?: {
      title?: string;
      summary?: string;
      url?: string;
    }[];
  };
}

export interface AssistantPlan {
  key: string;
  pending: boolean;
  steps: AssistantPlanStep[];
}

export interface AssistantPlanStep {
  id: string;
  status: NonNullable<RunStepEventResponse['data']>['status'];
  toolCalls: StepToolCall[];
  thought: string | null;
  lastError: NonNullable<RunStepEventResponse['data']>['last_error'];
}

export type StepToolCall = {
  id: string;
  input: string | null;
  result: string | null;
  sources?: string[];
} & (
  | {
      type: 'system';
      toolId: SystemToolId;
    }
  | {
      type: 'user';
      toolId: string;
    }
  | {
      type: Exclude<ToolType, 'system' | 'user'>;
    }
);

export type FunctionToolDefinition = Extract<
  NonNullable<RunCreateBody['tools']>[number],
  { type: 'function' }
>;

export type ToolApprovalRequest =
  RequiredActionToolApprovals['submit_tool_approvals']['tool_calls'][number];
