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
import { createMessage } from '@/app/api/threads-messages';
import { cancelRun } from '@/app/api/threads-runs';
import {
  RunsListResponse,
  ThreadRun,
  ToolApprovals,
} from '@/app/api/threads-runs/types';
import { isRequiredActionToolApprovals } from '@/app/api/threads-runs/utils';
import { Thread, ThreadMetadata } from '@/app/api/threads/types';
import { ToolsUsage } from '@/app/api/tools/types';
import { decodeEntityWithMetadata, encodeMetadata } from '@/app/api/utils';
import { Updater } from '@/hooks/useImmerWithGetter';
import { useStateWithRef } from '@/hooks/useStateWithRef';
import { useHandleError } from '@/layout/hooks/useHandleError';
import {
  useAppApiContext,
  useAppContext,
} from '@/layout/providers/AppProvider';
import { FILE_SEARCH_TOOL_DEFINITION } from '@/modules/assistants/builder/AssistantBuilderProvider';
import { GET_USER_LOCATION_FUNCTION_TOOL } from '@/modules/assistants/tools/functionTools';
import {
  getToolUsageId,
  isExternalTool,
  toolIncluded,
} from '@/modules/tools/utils';
import { isNotNull } from '@/utils/helpers';
import {
  FetchQueryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import truncate from 'lodash/truncate';
import {
  createContext,
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 as uuid } from 'uuid';
import { threadQuery, threadsQuery } from '../history/queries';
import { THREAD_TITLE_MAX_LENGTH } from '../history/ThreadItem';
import { useGetThreadAssistant } from '../history/useGetThreadAssistant';
import { useChatStream } from '../hooks/useChatStream';
import { useThreadApi } from '../hooks/useThreadApi';
import {
  messagesWithFilesQuery,
  readRunQuery,
  runsQuery,
  runStepsQuery,
} from '../queries';
import {
  ChatMessage,
  MessageWithFiles,
  ThreadAssistant,
  ToolApprovalValue,
  UserChatMessage,
} from '../types';
import {
  getRunResources,
  getThreadVectorStoreId,
  isBotMessage,
} from '../utils';
import { AssistantModalProvider } from './AssistantModalProvider';
import { useFilesUpload } from './FilesUploadProvider';
import { useMessages } from './useMessages';
import { AssistantBuilderState } from '@/modules/assistants/builder/Builder';
import { useModal } from '@/layout/providers/ModalProvider';
import { ApiError } from '@/app/api/errors';
import { UsageLimitModal } from '@/components/UsageLimitModal/UsageLimitModal';
import { PLAN_STEPS_QUERY_PARAMS } from '../assistant-plan/PlanWithSources';
import { useDeleteMessage } from '../api/useDeleteMessage';
import { Control } from 'react-hook-form';

interface CancelRunParams {
  threadId: string;
  runId: string;
}

export type ChatStatus = 'ready' | 'fetching' | 'waiting' | 'aborting';
export interface RunController {
  abortController: AbortController | null;
  status: ChatStatus;
  runId: string | null;
}

const RUN_CONTROLLER_DEFAULT: RunController = {
  abortController: null,
  status: 'ready',
  runId: null,
};

interface ChatSetup {
  topBarEnabled?: boolean;
  threadSettingsEnabled?: boolean;
  builderState?: AssistantBuilderState;
  initialAssistantMessage?: string;
  inputPlaceholder?: { initial: string; ongoing: string };
}

interface Props extends ChatSetup {
  thread?: Thread;
  assistant?: ThreadAssistant;
  initialData?: MessageWithFiles[];
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
  onBeforePostMessage,
  children,
}: PropsWithChildren<Props>) {
  const [controller, setController, controllerRef] =
    useStateWithRef<RunController>(RUN_CONTROLLER_DEFAULT);
  const [thread, setThread, threadRef] = useStateWithRef(initialThread || null);
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
  const threadSettingsButtonRef = useRef<HTMLButtonElement>(null);

  const { mutateAsync: mutateDeleteMessage } = useDeleteMessage();

  const threadAssistant = useGetThreadAssistant(thread, initialThreadAssistant);
  const {
    messages: [getMessages, setMessages],
    refetch: refetchMessages,
  } = useMessages({
    thread,
    initialData,
  });
  const handleToolApprovalSubmitRef = useRef<
    ((value: ToolApprovalValue) => void) | null
  >(null);
  const { chatStream } = useChatStream({
    threadRef,
    controllerRef,
    onToolApprovalSubmitRef: handleToolApprovalSubmitRef,
    setMessages,
    updateController: (data: Partial<RunController>) => {
      setController((controller) => ({ ...controller, ...data }));
    },
  });

  const { mutate: mutateCancel } = useMutation({
    mutationFn: ({ threadId, runId }: CancelRunParams) =>
      cancelRun(organization.id, project.id, threadId, runId),
  });

  const {
    updateMutation: { mutateAsync: mutateUpdateThread },
    createMutation: { mutateAsync: mutateCreateThread },
  } = useThreadApi(thread);

  useEffect(() => {
    if (threadAssistant?.data) selectAssistant(threadAssistant.data);
  }, [threadAssistant, selectAssistant]);

  useEffect(() => {
    const vectorStoreId =
      thread?.tool_resources?.file_search?.vector_store_ids?.at(0);
    if (vectorStoreId) setVectorStoreId(vectorStoreId);
  }, [setVectorStoreId, thread?.tool_resources?.file_search?.vector_store_ids]);

  const setMessagesWithFilesQueryData = useCallback(
    (
      threadId?: string,
      newMessage?: MessageWithFiles | null,
      runId?: string,
    ) => {
      if (threadId) {
        queryClient.setQueryData(
          messagesWithFilesQuery(organization.id, project.id, threadId)
            .queryKey,
          (messages) => {
            if (!newMessage) return messages;

            const existingIndex = messages?.findIndex(
              (item) => item.id === newMessage.id,
            );
            if (existingIndex && existingIndex !== -1) {
              return messages?.toSpliced(existingIndex, 1, newMessage);
            }
            return messages ? [...messages, newMessage] : [newMessage];
          },
        );
        queryClient.invalidateQueries({
          queryKey: messagesWithFilesQuery(
            organization.id,
            project.id,
            threadId,
          ).queryKey,
        });
        if (runId) {
          queryClient.invalidateQueries({
            queryKey: runStepsQuery(
              organization.id,
              project.id,
              threadId,
              runId,
              PLAN_STEPS_QUERY_PARAMS,
            ).queryKey,
          });
        }
      }
    },
    [project.id, organization.id, queryClient],
  );

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

  const ensureThread = useCallback(
    async (message?: string) => {
      const toolResources = vectorStoreId
        ? { file_search: { vector_store_ids: [vectorStoreId] } }
        : undefined;

      if (thread) {
        const threadMetadata = thread.uiMetadata;
        if (
          (vectorStoreId && !getThreadVectorStoreId(thread)) ||
          threadMetadata.title === ''
        ) {
          threadMetadata.title =
            threadMetadata.title === ''
              ? truncate(message, { length: THREAD_TITLE_MAX_LENGTH })
              : threadMetadata.title;

          const { thread: updatedThread } = await mutateUpdateThread({
            tool_resources: toolResources,
            metadata: encodeMetadata<ThreadMetadata>(threadMetadata),
          });

          if (updatedThread) {
            setThread(updatedThread);

            return updatedThread;
          }
        }

        return thread;
      }

      const { thread: createdThread } = await mutateCreateThread({
        tool_resources: toolResources,
        metadata: encodeMetadata<ThreadMetadata>({
          assistantName: assistant?.name ?? '',
          assistantId: assistant?.id ?? '',
          title: truncate(message, { length: THREAD_TITLE_MAX_LENGTH }),
        }),
      });

      if (!createdThread) {
        throw Error('Thread creation failed.');
      }

      setThread(createdThread);

      return createdThread;
    },
    [
      assistant?.id,
      assistant?.name,
      mutateCreateThread,
      mutateUpdateThread,
      setThread,
      thread,
      vectorStoreId,
    ],
  );

  if (ensureThreadRef) ensureThreadRef.current = ensureThread;

  const handleError = useHandleError();
  const { openModal } = useModal();

  const handleCancelCurrentRun = useCallback(() => {
    threadRef.current &&
      controllerRef.current.runId &&
      mutateCancel({
        threadId: threadRef.current.id,
        runId: controllerRef.current.runId,
      });
  }, [controllerRef, mutateCancel, threadRef]);

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
      queryClient.invalidateQueries({
        queryKey: readRunQuery(
          organization.id,
          project.id,
          threadRef.current.id,
          lastMessage?.run_id ?? '',
        ).queryKey,
      });

      onMessageCompleted?.(threadRef.current, lastMessage?.content ?? '');
    }
  }, [
    getMessages,
    onMessageCompleted,
    project.id,
    organization.id,
    queryClient,
    setController,
    setMessages,
    threadRef,
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
              setMessagesWithFilesQueryData(thread?.id, response.data);
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
      chatStream,
      controller.abortController?.signal.aborted,
      controllerRef,
      handleRunCompleted,
      handleCancelCurrentRun,
      handleError,
      setController,
      setMessagesWithFilesQueryData,
      thread?.id,
    ],
  );

  // check if last run finished successfully
  useEffect(() => {
    if (thread && getMessages().at(-1)?.role !== 'assistant') {
      queryClient
        .fetchQuery(
          runsQuery(organization.id, project.id, thread.id, {
            limit: 1,
            order: 'desc',
            order_by: 'created_at',
          }) as FetchQueryOptions<RunsListResponse>,
        )
        .then((data) => {
          const result = data?.data.at(0);
          if (result) {
            const run = decodeEntityWithMetadata<ThreadRun>(result);
            if (
              run.status === 'requires_action' &&
              run.required_action?.type === 'submit_tool_approvals'
            ) {
              requireUserApproval(run);
            }

            setMessages((messages) => {
              if (messages.at(-1)?.role !== 'assistant')
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
    project.id,
    organization.id,
    requireUserApproval,
  ]);

  const sendMessage = useCallback(
    async (
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
              mutateDeleteMessage({
                threadId: thread?.id,
                messageId: message.id,
              });
            }

            message = messages.at(-1);
            if (message?.role === 'user') {
              messages.pop();
              if (thread && message.id)
                mutateDeleteMessage({
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

          setMessagesWithFilesQueryData(thread.id, newMessage);
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
              setMessagesWithFilesQueryData(
                thread?.id,
                response.data,
                response.data?.run_id,
              );

              if (files.length > 0) {
                queryClient.invalidateQueries({
                  queryKey: threadsQuery(organization.id, project.id).queryKey,
                });

                queryClient.invalidateQueries({
                  queryKey: threadQuery(
                    organization.id,
                    project.id,
                    thread?.id ?? '',
                  ).queryKey,
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
    },
    [
      controllerRef,
      setController,
      refetchMessages,
      setMessages,
      mutateDeleteMessage,
      handleCancelCurrentRun,
      openModal,
      handleError,
      organization.id,
      project.id,
      attachments,
      files,
      clearFiles,
      assistant,
      ensureThread,
      getUsedTools,
      onBeforePostMessage,
      getMessages,
      setMessagesWithFilesQueryData,
      chatStream,
      queryClient,
      handleRunCompleted,
    ],
  );

  useEffect(() => {
    onPageLeaveRef.current = clear;
  }, [onPageLeaveRef, clear]);

  useEffect(() => {
    const abortController = controllerRef.current?.abortController;
    return () => {
      abortController?.abort();
    };
  }, [controllerRef]);

  const contextValue = useMemo(
    () => ({
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
    }),
    [
      controller.status,
      builderState,
      getMessages,
      cancel,
      clear,
      reset,
      setMessages,
      sendMessage,
      setThread,
      getThreadTools,
      thread,
      threadAssistant,
      assistant,
      disabledTools,
      topBarEnabled,
      threadSettingsEnabled,
      initialAssistantMessage,
      inputPlaceholder,
    ],
  );

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatMessagesContext.Provider value={getMessages()}>
        <AssistantModalProvider>{children}</AssistantModalProvider>
      </ChatMessagesContext.Provider>
    </ChatContext.Provider>
  );
}

export type SendMessageOptions = {
  regenerate?: boolean;
  onAfterRemoveSentMessage?: (message: UserChatMessage) => void;
};

export type SendMessageResult = {
  aborted: boolean;
  thread: Thread | null;
};

type ChatContextValue = ChatSetup & {
  status: ChatStatus;
  threadSettingsButtonRef: MutableRefObject<HTMLButtonElement | null>;
  getMessages: () => ChatMessage[];
  cancel: () => void;
  clear: () => void;
  reset: (messages: ChatMessage[]) => void;
  setMessages: Updater<ChatMessage[]>;
  sendMessage: (
    input: string,
    opts?: SendMessageOptions,
  ) => Promise<SendMessageResult>;
  setThread: Dispatch<SetStateAction<Thread | null>>;
  thread: Thread | null;
  assistant: ThreadAssistant;
  disabledTools: ToolsUsage;
  builderState?: AssistantBuilderState;
  setDisabledTools: Dispatch<SetStateAction<ToolsUsage>>;
  getThreadTools: () => ToolsUsage;
  onToolApprovalSubmitRef: MutableRefObject<
    ((value: ToolApprovalValue) => void) | null
  >;
};

const ChatContext = createContext<ChatContextValue>(
  null as unknown as ChatContextValue,
);

const ChatMessagesContext = createContext<ChatMessage[]>([]);

export function useChat() {
  const context = use(ChatContext);

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
}

export function useChatMessages() {
  const context = use(ChatMessagesContext);

  if (!context) {
    throw new Error('useChatMessages must be used within a ChatProvider');
  }

  return context;
}
