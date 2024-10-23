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
  MessageCompletedEventResponse,
  RequiredActionToolApprovals,
  RequiredActionToolOutput,
  RunEventResponse,
  RunsCreateBody,
  RunsCreateResponse,
} from '@/app/api/threads-runs/types';
import {
  isMessageCompletedEventResponse,
  isMessageCreatedEventResponse,
  isMessageDeltaEventResponse,
  isRequiredActionToolApprovals,
  isRequiredActionToolOutput,
  isRunEventResponse,
  isStepDeltaEventResponse,
  isStepEventResponse,
} from '@/app/api/threads-runs/utils';
import {
  SubmitToolApprovalsBody,
  SubmitToolOutput,
  SubmitToolOutputsBody,
} from '@/app/api/tools/types';
import {
  decodeMetadata,
  getProjectHeaders,
  handleFailedResponse,
  maybeGetJsonBody,
} from '@/app/api/utils';
import { Updater } from '@/hooks/useImmerWithGetter';
import {
  FunctionTool,
  getUserLocation,
} from '@/modules/assistants/tools/functionTools';
import {
  EventStreamContentType,
  fetchEventSource,
} from '@ai-zen/node-fetch-event-source';
import { MutableRefObject, RefObject } from 'react';
import {
  updatePlanWithRunStep,
  updatePlanWithRunStepDelta,
} from '../assistant-plan/utils';
import { ChatMessage, ToolApprovalValue } from '../types';
import { isBotMessage } from '../utils';
import { useQueryClient } from '@tanstack/react-query';
import { readRunQuery } from '../queries';
import { Thread, ThreadMetadata } from '@/app/api/threads/types';
import { getToolApprovalId } from '@/modules/tools/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { RunController } from '../providers/ChatProvider';

interface ChatStreamParams {
  action:
    | { id: 'create-run'; body: RunsCreateBody }
    | {
        id: 'process-approval';
        requiredAction: RequiredActionToolApprovals;
        approve: boolean;
      };
  onMessageCompleted: (response: MessageCompletedEventResponse) => void;
}

interface Props {
  threadRef: RefObject<Thread>;
  controllerRef: RefObject<RunController>;
  onToolApprovalSubmitRef: MutableRefObject<
    ((value: ToolApprovalValue) => void) | null
  >;
  setMessages: Updater<ChatMessage[]>;
  updateController: (data: Partial<RunController>) => void;
}

export function useChatStream({
  threadRef,
  controllerRef,
  onToolApprovalSubmitRef,
  setMessages,
  updateController,
}: Props) {
  const queryClient = useQueryClient();
  const { project } = useAppContext();

  const getThread = () => {
    const thread = threadRef.current;
    if (!thread) {
      throw Error('Thread is not defined!');
    }
    return thread;
  };

  const getRunId = () => {
    const runId = controllerRef.current?.runId;
    if (!runId) {
      throw Error('Run is not defined!');
    }
    return runId;
  };

  async function chatStream({ action, onMessageCompleted }: ChatStreamParams) {
    const abortController = controllerRef.current?.abortController ?? null;

    const requestToolOutput = async (action: RequiredActionToolOutput) => {
      updateController({ status: 'waiting' });

      const runId = getRunId();

      const functionToolCalls = action.submit_tool_outputs.tool_calls.filter(
        (toolCall) => toolCall.type === 'function',
      );

      const outputs: SubmitToolOutput[] = await Promise.all(
        functionToolCalls?.map(async (toolCall) => {
          let output = '';

          if (toolCall.function.name === FunctionTool.UserCoordinates) {
            output = await getUserLocation();
          }

          return {
            tool_call_id: toolCall.id,
            output,
          };
        }) ?? [],
      );

      updateController({ status: 'fetching' });

      await fetchEventStream({
        url: `/api/v1/threads/${getThread()?.id}/runs/${runId}/submit_tool_outputs`,
        body: {
          tool_outputs: outputs,
        },
        projectId: project.id,
        abortController,
        setMessages,
        handleRunEventResponse,
      });
    };

    const requestToolApprovals = async (
      action: RequiredActionToolApprovals,
    ) => {
      updateController({ status: 'waiting' });

      const thread = getThread();
      const runId = getRunId();

      const toolApproval = action.submit_tool_approvals.tool_calls.at(0);
      if (!toolApproval) return;

      const toolId = getToolApprovalId(toolApproval);
      const { approvedTools } = decodeMetadata<ThreadMetadata>(thread.metadata);

      let approve = toolId && approvedTools?.includes(toolId);
      if (!approve) {
        queryClient.setQueryData(
          readRunQuery(project.id, thread.id, runId).queryKey,
          (run) => (run ? { ...run, required_action: action } : undefined),
        );
        queryClient.invalidateQueries({
          queryKey: readRunQuery(project.id, thread.id, getRunId()).queryKey,
        });

        const waitForApproval = new Promise<ToolApprovalValue>((resolve) => {
          onToolApprovalSubmitRef.current = resolve;
        });

        approve = (await waitForApproval) !== 'decline';
      }

      await processToolApprovals(action, approve);
    };

    const processToolApprovals = async (
      action: RequiredActionToolApprovals,
      approve: boolean,
    ) => {
      const thread = getThread();
      const runId = getRunId();
      const toolApproval = action.submit_tool_approvals.tool_calls.at(0);
      if (!toolApproval) return;

      updateController({ status: 'fetching' });

      await fetchEventStream({
        url: `/api/v1/threads/${thread.id}/runs/${runId}/submit_tool_approvals`,
        body: {
          tool_approvals: [
            {
              tool_call_id: toolApproval.id,
              approve,
            },
          ],
        },
        projectId: project.id,
        abortController,
        setMessages,
        handleRunEventResponse,
      });
    };

    async function handleRunEventResponse(response: RunsCreateResponse) {
      if (response.event === 'thread.run.created') {
        const runId = response.data?.id;
        if (runId) updateController({ runId });

        setMessages((messages) => {
          const message = messages.at(-1);

          if (!isBotMessage(message)) {
            throw new Error('Unexpected last message found.');
          }

          message.run_id = runId;
        });
      } else if (
        isMessageDeltaEventResponse(response) ||
        isStepEventResponse(response) ||
        isStepDeltaEventResponse(response) ||
        isMessageCreatedEventResponse(response) ||
        isMessageCompletedEventResponse(response)
      ) {
        setMessages((messages) => {
          const message = messages.at(-1);

          if (!isBotMessage(message)) {
            throw new Error('Unexpected last message found.');
          }

          if (isMessageCreatedEventResponse(response)) {
            if (!response.data)
              throw new Error('Unexpected response for message created event');
            message.id = response.data.id;
          } else if (isMessageDeltaEventResponse(response)) {
            message.content += response.data?.delta.content
              .map(({ text: { value } }) => value)
              .join('');

            if (message.plan) message.plan.pending = false;
          } else if (isMessageCompletedEventResponse(response)) {
            message.content =
              response.data?.content
                .map(({ text: { value } }) => value)
                .join('') ?? '';
          } else if (isStepDeltaEventResponse(response)) {
            message.plan = updatePlanWithRunStepDelta(
              response.data,
              message.plan,
            );
          } else {
            message.plan = updatePlanWithRunStep(response.data, message.plan);
          }
        });

        if (isMessageCompletedEventResponse(response)) {
          onMessageCompleted(response);
        }
      } else if (
        isRunEventResponse(response) &&
        response.event === 'thread.run.requires_action' &&
        response.data
      ) {
        if (isRequiredActionToolOutput(response.data?.required_action))
          callsQueue.push(requestToolOutput(response.data.required_action));
        else if (isRequiredActionToolApprovals(response.data?.required_action))
          callsQueue.push(requestToolApprovals(response.data.required_action));
      }
    }

    const callsQueue: Promise<void>[] = [
      action.id === 'create-run'
        ? fetchEventStream({
            url: `/api/v1/threads/${getThread().id}/runs`,
            projectId: project.id,
            body: action.body,
            abortController,
            setMessages,
            handleRunEventResponse,
          })
        : processToolApprovals(action.requiredAction, action.approve),
    ];

    while (callsQueue.length) {
      const nextCall = callsQueue.shift();
      await nextCall;
    }
  }

  return {
    chatStream,
  };
}

async function fetchEventStream({
  projectId,
  url,
  body,
  abortController,
  setMessages,
  handleRunEventResponse,
}: {
  projectId: string;
  url: string;
  handleRunEventResponse: (response: RunsCreateResponse) => void;
  body: RunsCreateBody | SubmitToolOutputsBody | SubmitToolApprovalsBody;
  abortController: AbortController | null;
  setMessages: Updater<ChatMessage[]>;
}) {
  await fetchEventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getProjectHeaders(projectId),
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal: abortController?.signal,
    openWhenHidden: true,
    async onopen(response) {
      if (!response.ok) {
        return handleFailedResponse(response, await maybeGetJsonBody(response));
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith(EventStreamContentType)) {
        throw new Error(
          `Expected content-type to be ${EventStreamContentType}, Actual: ${contentType}`,
        );
      }
    },
    onmessage({ event, data }) {
      let parsedData;
      if (data) {
        try {
          parsedData = JSON.parse(data);
        } catch {
          throw new Error('Response format error');
        }
      }

      if (event === 'thread.run.failed') {
        throw makeAgentError(parsedData);
      } else if (event === 'retry') {
        setMessages((messages) => {
          const message = messages.at(-1);
          if (!isBotMessage(message)) {
            throw new Error('Unexpected last message found.');
          }
          message.content = '';
        });
      } else if (data) {
        handleRunEventResponse({
          event,
          data: parsedData,
        } as RunsCreateResponse);
      }
    },
    onerror(error) {
      setMessages((messages) => {
        const message = messages.at(-1);
        if (message != null) {
          message.error = error;
        }
      });

      throw error;
    },
  });
}

function makeAgentError(data: RunEventResponse['data']) {
  return new Error('An error occurred', { cause: data?.last_error?.message });
}
