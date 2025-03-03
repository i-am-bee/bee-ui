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
'use client';
import { ApiError } from '@/app/api/errors';
import { createMessage } from '@/app/api/threads-messages';
import {
  RunsListResponse,
  ThreadRun,
  ToolApprovals,
} from '@/app/api/threads-runs/types';
import { isRequiredActionToolApprovals } from '@/app/api/threads-runs/utils';
import { Thread } from '@/app/api/threads/types';
import { ToolsUsage } from '@/app/api/tools/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { UsageLimitModal } from '@/components/UsageLimitModal/UsageLimitModal';
import { useStateWithRef } from '@/hooks/useStateWithRef';
import { useHandleError } from '@/layout/hooks/useHandleError';
import {
  useAppApiContext,
  useAppContext,
} from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { FILE_SEARCH_TOOL_DEFINITION } from '@/modules/assistants/builder/AssistantBuilderProvider';
import { GET_USER_LOCATION_FUNCTION_TOOL } from '@/modules/assistants/tools/functionTools';
import {
  getToolUsageId,
  isExternalTool,
  toolIncluded,
} from '@/modules/tools/utils';
import { isNotNull } from '@/utils/helpers';
import { FetchQueryOptions, useQueryClient } from '@tanstack/react-query';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { v4 as uuid } from 'uuid';
import { useThreadsQueries } from '../api';
import { useCanceRun } from '../api/mutations/useCancelRun';
import { useDeleteMessage } from '../api/mutations/useDeleteMessage';
import { useChatStream } from '../hooks/useChatStream';
import { useGetThreadAssistant } from '../hooks/useGetThreadAssistant';
import { useMessages } from '../hooks/useMessages';
import {
  ChatMessage,
  MessageWithFiles,
  MessageWithFilesResponse,
  ThreadAssistant,
  ToolApprovalValue,
  UserChatMessage,
} from '../types';
import { getRunResources, isBotMessage } from '../utils';
import { AssistantModalProvider } from './AssistantModalProvider';
import {
  ChatContext,
  ChatMessagesContext,
  ChatSetup,
  RunController,
  SendMessageOptions,
} from './chat-context';
import { useFilesUpload } from './FilesUploadProvider';
import { useUpdateMessagesWithFilesQueryData } from '../hooks/useUpdateMessagesWithFilesQueryData';
import { DraftFunction } from '@/hooks/useImmerWithGetter';
import { useChatThread } from '../hooks/useChatThread';

const RUN_CONTROLLER_DEFAULT: RunController = {
  abortController: null,
  status: 'ready',
  runId: null,
};

interface Props extends ChatSetup {
  thread?: Thread;
  assistant?: ThreadAssistant;
  initialData?: MessageWithFilesResponse;
  onMessageDeltaEventResponse?: (message: string) => void;
  onMessageCompleted?: (thread: Thread, content: string) => void;
  onBeforePostMessage?: (
    thread: Thread,
    messages: ChatMessage[],
  ) => Promise<void>;
}

export function ChatProvider({
  thread: initialThread,
  assistant: initialThreadAssistant,
  initialData,
  topBarEnabled,
  threadSettingsEnabled,
  initialAssistantMessage,
  builderState,
  inputPlaceholder,
  onMessageCompleted,
  onMessageDeltaEventResponse,
  onBeforePostMessage,
  children,
}: PropsWithChildren<Props>) {
  const [controller, setController, controllerRef] =
    useStateWithRef<RunController>(RUN_CONTROLLER_DEFAULT);
  const [disabledTools, setDisabledTools] = useState<ToolsUsage>([]);
  const {
    files,
    attachments,
    vectorStoreId,
    setVectorStoreId,
    reset: resetFiles,
    clearFiles,
    ensureThreadRef,
  } = useFilesUpload();
  const { assistant, onPageLeaveRef, project, organization, featureFlags } =
    useAppContext();
  const { selectAssistant } = useAppApiContext();
  const queryClient = useQueryClient();
  const threadsQueries = useThreadsQueries();
  const threadSettingsButtonRef = useRef<HTMLButtonElement>(null);

  const { mutateAsync: deleteMessage } = useDeleteMessage();
  const { mutate: cancelRun } = useCanceRun();

  const { updateMessageData } = useUpdateMessagesWithFilesQueryData();

  const { ensureThread, thread, threadRef, setThread } = useChatThread({
    thread: initialThread,
    assistant,
  });

  const threadAssistant = useGetThreadAssistant(thread, initialThreadAssistant);
  const {
    getMessages,
    setMessages,
    queryControl: messagesQueryControl,
  } = useMessages({
    thread,
    initialData,
  });
  const { refetch: refetchMessages } = messagesQueryControl;

  const handleToolApprovalSubmitRef = useRef<
    ((value: ToolApprovalValue) => void) | null
  >(null);

  const updateCurrentMessage = useCallback(
    (updater: DraftFunction<ChatMessage>) => {
      setMessages((messages) => {
        const message = messages.at(-1);
        if (!message) throw Error('No current message exists.');
        updater(message);
      });
    },
    [setMessages],
  );

  const { chatStream } = useChatStream({
    threadRef,
    controllerRef,
    onToolApprovalSubmitRef: handleToolApprovalSubmitRef,
    onMessageDeltaEventResponse,
    updateCurrentMessage,
    updateController: (data: Partial<RunController>) => {
      setController((controller) => ({ ...controller, ...data }));
    },
  });

  useEffect(() => {
    if (threadAssistant?.data) selectAssistant(threadAssistant.data);
  }, [threadAssistant, selectAssistant]);

  useEffect(() => {
    const vectorStoreId =
      thread?.tool_resources?.file_search?.vector_store_ids?.at(0);
    if (vectorStoreId) setVectorStoreId(vectorStoreId);
  }, [setVectorStoreId, thread?.tool_resources?.file_search?.vector_store_ids]);

  const getThreadTools = useCallback(() => {
    return assistant
      ? [
          ...assistant.tools,
          ...(vectorStoreId &&
          assistant.tools.every((tool) => tool.type !== 'file_search')
            ? [FILE_SEARCH_TOOL_DEFINITION]
            : []),
          ...(featureFlags.FunctionTools
            ? [GET_USER_LOCATION_FUNCTION_TOOL]
            : []),
        ]
      : [];
  }, [assistant, featureFlags.FunctionTools, vectorStoreId]);

  const getUsedTools = useCallback(
    (thread: Thread) => {
      const tools = getThreadTools().filter(
        (t) => !toolIncluded(disabledTools, t),
      );

      const { approvedTools } = thread.uiMetadata;
      const toolApprovals = tools.reduce((toolApprovals, tool) => {
        const toolId = getToolUsageId(tool);

        if (isNotNull(toolId) && isExternalTool(tool.type, toolId)) {
          toolApprovals[toolId] = {
            require: approvedTools?.includes(toolId) ? 'never' : 'always',
          };
        }
        return toolApprovals;
      }, {} as NonNullable<ToolApprovals>);

      return { tools, toolApprovals };
    },
    [disabledTools, getThreadTools],
  );

  const cancel = useCallback(() => {
    controllerRef.current.abortController?.abort();
    setController((controller) => ({ ...controller, status: 'aborting' }));
  }, [controllerRef, setController]);

  const reset = useCallback(
    (messages: ChatMessage[]) => {
      controllerRef.current.abortController?.abort();
      setController(RUN_CONTROLLER_DEFAULT);
      setMessages(messages);
      setThread(null);
      resetFiles();
    },
    [controllerRef, resetFiles, setController, setMessages, setThread],
  );

  const clear = useCallback(() => reset([]), [reset]);

  const handleError = useHandleError();
  const { openModal } = useModal();

  const handleCancelCurrentRun = useCallback(() => {
    threadRef.current &&
      controllerRef.current.runId &&
      cancelRun({
        threadId: threadRef.current.id,
        runId: controllerRef.current.runId,
      });
  }, [controllerRef, cancelRun, threadRef]);

  const handleRunCompleted = useCallback(() => {
    const lastMessage = getMessages().at(-1);

    setController(RUN_CONTROLLER_DEFAULT);

    setMessages((messages) => {
      const lastMessage = messages.at(-1);
      if (isBotMessage(lastMessage)) {
        lastMessage.pending = false;
      }
    });

    if (threadRef.current) {
      queryClient.invalidateQueries(
        threadsQueries.runDetail(
          threadRef.current.id,
          lastMessage?.run_id ?? '',
        ),
      );

      onMessageCompleted?.(threadRef.current, lastMessage?.content ?? '');
    }
  }, [
    getMessages,
    onMessageCompleted,
    queryClient,
    setController,
    setMessages,
    threadRef,
    threadsQueries,
  ]);

  const requireUserApproval = useCallback(
    async (run: ThreadRun) => {
      const requiredAction = run.required_action;
      if (
        run.status !== 'requires_action' ||
        !isRequiredActionToolApprovals(requiredAction) ||
        controllerRef.current.status !== 'ready'
      )
        return;

      const abortController = new AbortController();
      setController({
        abortController,
        status: 'waiting',
        runId: run.id,
      });

      handleToolApprovalSubmitRef.current = async (
        result: ToolApprovalValue,
      ) => {
        try {
          await chatStream({
            action: {
              id: 'process-approval',
              requiredAction,
              approve: result !== 'decline',
            },
            onMessageCompleted: (response) => {
              updateMessageData(thread?.id, response.data);
            },
          });
        } catch (err) {
          handleError(err, { toast: false });
        } finally {
          handleRunCompleted();
        }

        const aborted = controller.abortController?.signal.aborted;
        if (aborted) {
          handleCancelCurrentRun();
        }
      };
    },
    [
      controllerRef,
      setController,
      controller.abortController?.signal.aborted,
      chatStream,
      updateMessageData,
      thread?.id,
      handleError,
      handleRunCompleted,
      handleCancelCurrentRun,
    ],
  );

  // check if last run finished successfully
  useEffect(() => {
    if (thread && getMessages().at(-1)?.role !== 'assistant') {
      queryClient
        .fetchQuery(
          threadsQueries.runsList(thread.id, {
            limit: 1,
            order: 'desc',
            order_by: 'created_at',
          }) as FetchQueryOptions<RunsListResponse>,
        )
        .then((data) => {
          const result = data?.data.at(-1);
          if (result) {
            const run = decodeEntityWithMetadata<ThreadRun>(result);
            if (
              run.status === 'requires_action' &&
              run.required_action?.type === 'submit_tool_approvals'
            ) {
              requireUserApproval(run);
            }

            setMessages((messages) => {
              if (messages.at(0)?.role !== 'assistant')
                messages.push({
                  key: uuid(),
                  role: 'assistant',
                  content: '',
                  pending: false,
                  error: run.last_error
                    ? Error(run.last_error?.message)
                    : undefined,
                  created_at: run.created_at ?? new Date().getTime(),
                  run_id: run.id,
                });
            });
          }
        });
    }
  }, [
    thread,
    getMessages,
    setMessages,
    queryClient,
    requireUserApproval,
    threadsQueries,
  ]);

  const sendMessage = async (
    input: string,
    { regenerate, onAfterRemoveSentMessage }: SendMessageOptions = {},
  ) => {
    if (controllerRef.current.status !== 'ready') {
      return { aborted: true, thread: null };
    }

    const abortController = new AbortController();
    setController({
      abortController,
      status: 'fetching',
      runId: null,
    });

    // Remove last bot message if it was empty, and also last user message
    async function removeLastMessagePair(ignoreError?: boolean) {
      // synchronize messages before removing
      await refetchMessages();

      setMessages((messages) => {
        let message = messages.at(-1);
        if (!isBotMessage(message)) {
          throw new Error('Unexpected last message found.');
        }

        if (message.plan) {
          message.plan.steps = message.plan.steps.map((step) =>
            step.status === 'in_progress'
              ? { ...step, status: 'cancelled' }
              : step,
          );
        }

        if (
          !regenerate &&
          messages.length > 2 &&
          !message.content &&
          message.plan == null &&
          (ignoreError || message.error == null)
        ) {
          messages.pop();
          if (thread && message.id) {
            deleteMessage({
              threadId: thread?.id,
              messageId: message.id,
            });
          }

          message = messages.at(-1);
          if (message?.role === 'user') {
            messages.pop();
            if (thread && message.id)
              deleteMessage({
                threadId: thread?.id,
                messageId: message.id,
              });
            onAfterRemoveSentMessage?.(message);
          }
        }
      });
    }

    function handleAborted() {
      handleCancelCurrentRun();
      removeLastMessagePair();
    }

    function handleChatError(err: unknown) {
      if (err instanceof ApiError && err.code === 'too_many_requests') {
        openModal((props) => <UsageLimitModal {...props} />);
        removeLastMessagePair(true);
      } else {
        handleError(err, { toast: false });
      }
    }

    async function handlePostMessage(
      threadId: string,
      { role, content, attachments, files }: UserChatMessage,
    ): Promise<MessageWithFiles | null> {
      const message = await createMessage(
        organization.id,
        project.id,
        threadId,
        {
          role,
          content,
          attachments,
        },
      );

      setMessages((messages) => {
        const lastUserMessage = messages.findLast(
          ({ role }) => role === 'user',
        );
        if (!lastUserMessage) throw Error('Message was not created.');
        lastUserMessage.id = message?.id;
      });

      return message
        ? {
            ...message,
            files,
          }
        : null;
    }

    function handleCreateChatMessages(): UserChatMessage {
      const userMessage: UserChatMessage = {
        key: uuid(),
        role: 'user',
        content: input,
        attachments,
        files,
        created_at: new Date().getTime(),
      };

      setMessages((messages) => {
        // if we are regenerating we don't add a new message
        if (!regenerate) {
          const lastMessage = messages.at(-1);
          if (lastMessage?.role === 'user') {
            messages.pop();
          }

          messages.push(userMessage);
        }
        messages.push({
          key: uuid(),
          role: 'assistant',
          content: '',
          pending: true,
          created_at: new Date().getTime(),
        });
      });

      clearFiles();

      return userMessage;
    }

    let thread: Thread | null = null;
    let newMessage: MessageWithFiles | null = null;

    try {
      if (!assistant) throw Error('Assistant is not available.');

      const userMessage = handleCreateChatMessages();
      thread = await ensureThread(userMessage.content);

      if (!regenerate) {
        await onBeforePostMessage?.(thread, getMessages());
        newMessage = await handlePostMessage(thread.id, userMessage);

        updateMessageData(thread.id, newMessage);
      }

      const { tools, toolApprovals } = getUsedTools(thread);

      if (!abortController.signal.aborted) {
        await chatStream({
          action: {
            id: 'create-run',
            body: {
              assistant_id: assistant.id,
              tools,
              tool_approvals: toolApprovals,
              uiMetadata: {
                resources: getRunResources(thread, assistant),
              },
            },
          },
          onMessageCompleted: (response) => {
            updateMessageData(thread?.id, response.data, response.data?.run_id);

            if (files.length > 0) {
              queryClient.invalidateQueries({
                queryKey: threadsQueries.lists(),
              });
            }
          },
        });
      }
    } catch (err) {
      handleChatError(err);
    } finally {
      handleRunCompleted();
    }

    const aborted = abortController.signal.aborted;
    if (aborted) {
      handleAborted();
    }

    return {
      aborted,
      thread,
    };
  };

  useEffect(() => {
    onPageLeaveRef.current = clear;
  }, [onPageLeaveRef, clear]);

  useEffect(() => {
    const abortController = controllerRef.current?.abortController;
    return () => {
      abortController?.abort();
    };
  }, [controllerRef]);

  const contextValue = {
    status: controller.status,
    builderState,
    getMessages,
    cancel,
    clear,
    reset,
    setMessages,
    sendMessage,
    setThread,
    setDisabledTools,
    getThreadTools,
    onToolApprovalSubmitRef: handleToolApprovalSubmitRef,
    thread,
    assistant: {
      ...threadAssistant,
      data:
        threadAssistant.data || threadAssistant.isDeleted
          ? threadAssistant.data
          : assistant,
    },
    disabledTools,
    threadSettingsButtonRef,
    topBarEnabled,
    threadSettingsEnabled,
    initialAssistantMessage,
    inputPlaceholder,
    messagesQueryControl,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatMessagesContext.Provider value={getMessages()}>
        <AssistantModalProvider>{children}</AssistantModalProvider>
      </ChatMessagesContext.Provider>
    </ChatContext.Provider>
  );
}
