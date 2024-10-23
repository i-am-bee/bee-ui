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

import { listRuns, listRunSteps, readRun } from '.';
import { paths } from '../schema';
import { MessageFeedback } from '../threads-messages/types';

export type RunsCreateBody =
  paths['/v1/threads/{thread_id}/runs']['post']['requestBody']['content']['application/json'];

export type RunsCreateResponse = NonNullable<
  paths['/v1/threads/{thread_id}/runs']['post']['responses']['200']['content']['text/event-stream']
>;

export type RunsListQuery = NonNullable<
  paths['/v1/threads/{thread_id}/runs']['get']['parameters']['query']
>;

export type RunsListResponse = Awaited<ReturnType<typeof listRuns>>;

export type ThreadRun = NonNullable<Awaited<ReturnType<typeof readRun>>>;

export type RunsCreateResponseEvent = RunsCreateResponse['event'];

export const THREAD_RUN_EVENT_NAMES = [
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
] as const satisfies RunsCreateResponseEvent[];
export type RunEventName = (typeof THREAD_RUN_EVENT_NAMES)[number];

export const RUN_STEP_EVENT_NAMES = [
  'thread.run.step.created',
  'thread.run.step.in_progress',
  'thread.run.step.completed',
  'thread.run.step.failed',
  'thread.run.step.cancelled',
  'thread.run.step.expired',
] as const satisfies RunsCreateResponseEvent[];
type RunStepEventName = (typeof RUN_STEP_EVENT_NAMES)[number];

export type RunEventResponse = RunsCreateResponse & {
  event: RunEventName;
};

export type RunStepEventResponse = RunsCreateResponse & {
  event: RunStepEventName;
  data: RunsCreateResponse['data'] & {
    metadata: { caption?: string };
  };
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

export type RunStepDeltaEventResponse = RunsCreateResponse & {
  event: 'thread.run.step.delta';
};

export type MessageDeltaEventResponse = RunsCreateResponse & {
  event: 'thread.message.delta';
};

export type MessageCreatedEventResponse = RunsCreateResponse & {
  event: 'thread.message.created';
};

export type MessageCompletedEventResponse = RunsCreateResponse & {
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

export type ToolApprovals = RunsCreateBody['tool_approvals'];

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
  caption: string;
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

export type RunStepsQuery = NonNullable<
  paths['/v1/threads/{thread_id}/runs/{run_id}/steps']['get']['parameters']['query']
>;

export type RunStepsResponse = NonNullable<
  Awaited<ReturnType<typeof listRunSteps>>
>;
export type RunStep = RunStepsResponse['data'][number];

export type FunctionToolDefinition = Extract<
  NonNullable<RunsCreateBody['tools']>[number],
  { type: 'function' }
>;

export type RunUpdateBody = NonNullable<
  paths['/v1/threads/{thread_id}/runs/{run_id}']['post']['requestBody']
>['content']['application/json'];

export type RunMetadata = {
  feedback?: MessageFeedback;
};

export type ToolApprovalRequest =
  RequiredActionToolApprovals['submit_tool_approvals']['tool_calls'][number];
