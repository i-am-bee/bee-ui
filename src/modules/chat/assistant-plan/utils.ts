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
  AssistantPlan,
  ResponseToolCall,
  RunStep,
  RunStepDeltaEventResponse,
  StepToolCall,
  SystemToolResult,
  ThreadRun,
} from '@/app/api/threads-runs/types';
import {
  isArXivToolResult,
  isRunStepDeltaEventDetailsThought,
  isWebSearchToolResult,
  isWikipediaToolResult,
} from '@/app/api/threads-runs/utils';
import { getToolApprovalId } from '@/modules/tools/utils';
import { isNotNull } from '@/utils/helpers';
import { v4 as uuid } from 'uuid';

export function getLastCompletedStep(plan?: AssistantPlan) {
  return plan?.steps.findLast((step) => step.status === 'completed');
}

function getToolCallInput(toolCall: ResponseToolCall): string | null {
  let input;
  switch (toolCall.type) {
    case 'system':
      input = toolCall.system.input;
      return typeof input === 'string' ? input : JSON.stringify(input);
    case 'code_interpreter':
      input = toolCall.code_interpreter.input;
      // @ts-expect-error temporary wrong type, until fixed on api
      return typeof input === 'object' ? input?.code : input;
    case 'user':
      return toolCall.user.arguments;
    case 'function':
      return toolCall.function.arguments;
    case 'file_search':
      return toolCall.file_search?.input ?? '';
    default:
      return null;
  }
}

function getToolCallResult(toolCall: ResponseToolCall): string | null {
  switch (toolCall.type) {
    case 'system':
      return getSystemToolOutputAsString(toolCall.system);
    case 'code_interpreter':
      return formatToolOutput(toolCall.code_interpreter.outputs, (item) =>
        item.type === 'logs' ? item.logs : null,
      );
    case 'user':
      return toolCall.user.output;
    case 'function':
      return toolCall.function.output;
    case 'file_search':
      return formatToolOutput(
        toolCall.file_search?.output,
        ({ content, source }) =>
          `${content}${source ? `\nSource: ${source}` : ''}`,
      );
    default:
      return null;
  }
}

function getToolCallSources(toolCall: ResponseToolCall): string[] | undefined {
  if (toolCall.type === 'system') {
    if (isWebSearchToolResult(toolCall.system)) {
      return toolCall.system.output?.map(({ url }) => url).filter(isNotNull);
    } else if (isWikipediaToolResult(toolCall.system)) {
      return toolCall.system.output
        ?.map(({ document, url }) => document?.url || url)
        .filter(isNotNull);
    } else if (isArXivToolResult(toolCall.system)) {
      return toolCall.system.output?.entries
        ?.map(({ url }) => url)
        .filter(isNotNull);
    }

    return undefined;
  }

  return undefined;
}

function getSystemToolOutputAsString(result: SystemToolResult): string {
  if (isWebSearchToolResult(result))
    return formatToolOutput(
      result.output,
      ({ description, url }) =>
        `${description}${url ? `\nSource: ${url}` : ''}`,
    );

  if (isWikipediaToolResult(result))
    return formatToolOutput(
      result.output,
      ({ document, description }) => document?.text || description,
    );

  return typeof result.output === 'string'
    ? result.output
    : JSON.stringify(result.output);
}

function formatToolOutput<T extends object>(
  output: T[] | undefined,
  mapFn: (item: T) => string | null | undefined,
): string {
  return output?.map(mapFn).filter(isNotNull).join('\n\n').trim() ?? '';
}

export function updatePlanWithRunStep(
  runStep: RunStep,
  plan?: AssistantPlan,
): AssistantPlan | undefined {
  if (!runStep) return plan;

  if (!plan)
    plan = {
      key: uuid(),
      pending: true,
      steps: [],
    };

  const {
    id: stepId,
    status,
    step_details: stepDetails,
    last_error: lastError,
  } = runStep;
  const step = plan.steps.find(({ id }) => id === stepId);

  let thought = step?.thought ?? null;

  if (!step) {
    // thought comes as a separate step and it should be relevant
    // for all subsequent steps with tool_calls
    const lastStepWithThought = plan.steps.findLast((step) => step.thought);

    if (lastStepWithThought) thought = lastStepWithThought.thought;
  }
  let newStepData = {
    toolCalls: [],
    ...step,
    thought,
    id: stepId,
    status,
    lastError,
  };

  if (stepDetails.type === 'tool_calls') {
    const toolCalls = stepDetails.tool_calls.map((item, index) => {
      return {
        id: step?.toolCalls?.at(index)?.id ?? uuid(),
        ...(item.type === 'system'
          ? { toolId: item.system.id, type: 'system' }
          : item.type === 'user'
            ? { toolId: item.user.tool.id, type: 'user' }
            : { type: item.type }),
        result: getToolCallResult(item),
        input: getToolCallInput(item),
        sources: getToolCallSources(item),
      } satisfies StepToolCall;
    });
    newStepData = {
      ...newStepData,
      toolCalls,
    };
  } else if (stepDetails.type === 'thought') {
    newStepData = {
      ...newStepData,
      thought: stepDetails.thought.content,
    };
  }

  if (step) {
    plan.steps = plan.steps.map((item) =>
      item.id === stepId ? newStepData : item,
    );
  } else {
    plan.steps.push(newStepData);
  }

  return plan;
}

export function updatePlanWithRunStepDelta(
  data: RunStepDeltaEventResponse['data'],
  plan?: AssistantPlan,
): AssistantPlan | undefined {
  if (!data || !plan) return plan;

  const stepDetails = data.delta.step_details;
  if (isRunStepDeltaEventDetailsThought(stepDetails)) {
    plan.steps = plan.steps.map((item) =>
      item.id === data.id
        ? {
            ...item,
            thought: `${item.thought ?? ''}${stepDetails.thought.content}`,
          }
        : item,
    );
  }
  return plan;
}

export function getToolReferenceFromToolCall(toolCall: StepToolCall) {
  const toolKey = toolCall.type;
  return toolKey === 'system'
    ? {
        type: toolKey,
        id: toolCall.toolId,
      }
    : toolKey === 'user'
      ? {
          type: toolKey,
          id: toolCall.toolId,
        }
      : { type: toolKey, id: toolKey };
}

export function getToolApproval(toolCall: StepToolCall, run?: ThreadRun) {
  const tool = getToolReferenceFromToolCall(toolCall);

  if (
    run?.status === 'requires_action' &&
    run.required_action?.type === 'submit_tool_approvals'
  ) {
    return run.required_action.submit_tool_approvals.tool_calls
      .map((tool) => ({
        id: tool.id,
        toolId: getToolApprovalId(tool),
        type: tool.type,
      }))
      .find((toolApproval) => toolApproval.toolId === tool.id);
  }

  return null;
}
