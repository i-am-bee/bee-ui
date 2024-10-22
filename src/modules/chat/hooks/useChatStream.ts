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
import { ChatStatus } from '../providers/ChatProvider';
import { ChatMessage, ToolApprovalValue } from '../types';
import { isBotMessage } from '../utils';
import { useQueryClient } from '@tanstack/react-query';
import { readRunQuery } from '../queries';

interface ChatStreamParams {
  projectId: string;
  threadId: string;
  runIdRef: MutableRefObject<string | null>;
  body: RunsCreateBody | SubmitToolOutputsBody;
  abortController: AbortController;
  onToolApprovalSubmitRef: MutableRefObject<
    ((value: ToolApprovalValue) => void) | null
  >;
  setStatus: (status: ChatStatus) => void;
  setMessages: Updater<ChatMessage[]>;
  onMessageCompleted: (response: MessageCompletedEventResponse) => void;
}

export function useChatStream() {
  const queryClient = useQueryClient();

  async function chatStream({
    projectId,
    threadId,
    runIdRef,
    body,
    abortController,
    onToolApprovalSubmitRef,
    setStatus,
    setMessages,
    onMessageCompleted,
  }: ChatStreamParams) {
    const callsQueue: Promise<void>[] = [
      fetchEventStream({
        url: `/api/v1/threads/${threadId}/runs`,
        projectId,
        body,
        abortController,
        setMessages,
        handleRunEventResponse,
      }),
    ];

    const processToolOutput = async (
      runId: string,
      action: RequiredActionToolOutput,
    ) => {
      setStatus('waiting');

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

      setStatus('fetching');

      await fetchEventStream({
        url: `/api/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
        body: {
          tool_outputs: outputs,
        },
        projectId,
        abortController,
        setMessages,
        handleRunEventResponse,
      });
    };

    const processToolApprovals = async (
      runId: string,
      action: RequiredActionToolApprovals,
    ) => {
      setStatus('waiting');

      queryClient.invalidateQueries({
        queryKey: readRunQuery(projectId, threadId, runId).queryKey,
      });

      const toolCallId = action.submit_tool_approvals.tool_calls.at(0)?.id;
      if (!toolCallId) return;

      const waitForApproval = new Promise<ToolApprovalValue>((resolve) => {
        onToolApprovalSubmitRef.current = resolve;
      });

      const result = await waitForApproval;

      setStatus('fetching');

      await fetchEventStream({
        url: `/api/v1/threads/${threadId}/runs/${runId}/submit_tool_approvals`,
        body: {
          tool_approvals: [
            {
              tool_call_id: toolCallId,
              approve: result !== 'decline',
            },
          ],
        },
        projectId,
        abortController,
        setMessages,
        handleRunEventResponse,
      });
    };

    async function handleRunEventResponse(response: RunsCreateResponse) {
      if (response.event === 'thread.run.created') {
        const runId = response.data?.id;
        runIdRef.current = runId ?? null;

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
        response.data &&
        isRequiredActionToolOutput(response.data?.required_action)
      ) {
        callsQueue.push(
          processToolOutput(response.data.id, response.data.required_action),
        );
      } else if (
        isRunEventResponse(response) &&
        response.event === 'thread.run.requires_action' &&
        response.data &&
        isRequiredActionToolApprovals(response.data?.required_action)
      ) {
        callsQueue.push(
          processToolApprovals(response.data.id, response.data.required_action),
        );
      }
    }

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
  abortController: AbortController;
  setMessages: Updater<ChatMessage[]>;
}) {
  await fetchEventSource(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getProjectHeaders(projectId),
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal: abortController.signal,
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
