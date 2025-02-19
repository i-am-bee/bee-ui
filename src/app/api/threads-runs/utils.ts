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

import {
  ArXivToolResult,
  MessageCompletedEventResponse,
  MessageCreatedEventResponse,
  MessageDeltaEventResponse,
  RequiredAction,
  RequiredActionToolApprovals,
  RequiredActionToolOutput,
  ResponseToolCall,
  RUN_EVENT_NAMES,
  RUN_STEP_EVENT_NAMES,
  RunCreateResponse,
  RunEventResponse,
  RunStepDeltaEventDetails,
  RunStepDeltaEventDetailsThought,
  RunStepDeltaEventResponse,
  RunStepEventResponse,
  RunStepEventResponseDetail,
  RunStepEventResponseDetailToolCall,
  SystemToolCall,
  WebSearchToolResult,
  WikipediaToolResult,
} from './types';

export function isRunEventResponse(
  response: RunCreateResponse,
): response is RunEventResponse {
  return response.event
    ? (RUN_EVENT_NAMES as ReadonlyArray<string>).includes(response.event)
    : false;
}

export function isStepEventResponse(
  response: RunCreateResponse,
): response is RunStepEventResponse {
  return response.event
    ? (RUN_STEP_EVENT_NAMES as ReadonlyArray<string>).includes(response.event)
    : false;
}

export function isStepDeltaEventResponse(
  response: RunCreateResponse,
): response is RunStepDeltaEventResponse {
  return response.event === 'thread.run.step.delta';
}

export function isMessageDeltaEventResponse(
  response: RunCreateResponse,
): response is MessageDeltaEventResponse {
  return response.event === 'thread.message.delta';
}

export function isMessageCreatedEventResponse(
  response: RunCreateResponse,
): response is MessageCreatedEventResponse {
  return response.event === 'thread.message.created';
}

export function isMessageCompletedEventResponse(
  response: RunCreateResponse,
): response is MessageCompletedEventResponse {
  return response.event === 'thread.message.completed';
}

export function isRunStepEventResponseDetailToolCall(
  detail: RunStepEventResponseDetail,
): detail is RunStepEventResponseDetailToolCall {
  return detail.type === 'tool_calls';
}

export function isRunStepDeltaEventDetailsThought(
  detail: RunStepDeltaEventDetails,
): detail is RunStepDeltaEventDetailsThought {
  return detail.type === 'thought';
}

export function isSystemToolCall(
  toolCall: ResponseToolCall,
): toolCall is SystemToolCall {
  return toolCall.type === 'system';
}

export function isWebSearchToolResult(
  result: SystemToolCall['system'],
): result is WebSearchToolResult {
  return result.id === 'web_search';
}

export function isWikipediaToolResult(
  result: SystemToolCall['system'],
): result is WikipediaToolResult {
  return result.id === 'wikipedia';
}

export function isArXivToolResult(
  result: SystemToolCall['system'],
): result is ArXivToolResult {
  return result.id === 'arxiv';
}

export function isRequiredActionToolOutput(
  result: RequiredAction,
): result is RequiredActionToolOutput {
  return result?.type === 'submit_tool_outputs';
}

export function isRequiredActionToolApprovals(
  result: RequiredAction,
): result is RequiredActionToolApprovals {
  return result?.type === 'submit_tool_approvals';
}
