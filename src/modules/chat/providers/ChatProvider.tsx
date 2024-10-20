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
import { createThread, updateThread } from '@/app/api/threads';
import { createMessage } from '@/app/api/threads-messages';
import { cancelRun } from '@/app/api/threads-runs';
import { RunsListResponse, ToolApprovals } from '@/app/api/threads-runs/types';
import {
  Thread,
  ThreadCreateBody,
  ThreadMetadata,
  ThreadUpdateBody,
} from '@/app/api/threads/types';
import { ToolsUsage } from '@/app/api/tools/types';
import { decodeMetadata, encodeMetadata } from '@/app/api/utils';
import { useLatestRef } from '@/hooks';
import { Updater } from '@/hooks/useImmerWithGetter';
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
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import {
  FetchQueryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import truncate from 'lodash/truncate';
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { THREAD_TITLE_MAX_LENGTH } from '../history/ThreadItem';
import { useGetThreadAssistant } from '../history/useGetThreadAssistant';
import { useChatStream } from '../hooks/useChatStream';
import { messagesWithFilesQuery, readRunQuery, runsQuery } from '../queries';
import {
  ChatMessage,
  MessageWithFiles,
  ThreadAssistant,
  UserChatMessage,
} from '../types';
import { getThreadVectorStoreId, isBotMessage } from '../utils';
import { AssistantModalProvider } from './AssistantModalProvider';
import { useFilesUpload } from './FilesUploadProvider';
import { useMessages } from './useMessages';

interface CancelRunParams {
  threadId: string;
  runId: string;
}

export type ChatStatus = 'ready' | 'fetching' | 'waiting';
export interface ChatController {
  abortController: AbortController | null;
  status: ChatStatus;
}

const CHAT_CONTROLLER_DEFAULT: ChatController = {
  abortController: null,
  status: 'ready',
};

interface Props {
  thread?: Thread;
  threadAssistant?: ThreadAssistant;
  initialData?: MessageWithFiles[];
}

export function ChatProvider({
  thread: initialThread,
  threadAssistant: initialThreadAssistant,
  initialData,
  children,
}: PropsWithChildren<Props>) {
  const runIdRef = useRef<string | null>(null);
  const [controller, setController] = useState<ChatController>(
    CHAT_CONTROLLER_DEFAULT,
  );
  const controllerRef = useLatestRef(controller);
  const [thread, setThread] = useState(initialThread || null);
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
  const { assistant, onPageLeaveRef, project } = useAppContext();
  const { selectAssistant } = useAppApiContext();
  const { chatStream } = useChatStream();
  const queryClient = useQueryClient();

  const threadAssistant = useGetThreadAssistant(thread, initialThreadAssistant);
  const [getMessages, setMessages] = useMessages({
    thread,
    initialData,
  });

  const { mutate: mutateCancel } = useMutation({
    mutationFn: ({ threadId, runId }: CancelRunParams) =>
      cancelRun(project.id, threadId, runId),
  });

  const { mutateAsync: mutateCreateThread } = useMutation({
    mutationFn: (body: ThreadCreateBody) => createThread(project.id, body),
    meta: {
      errorToast: {
        title: 'Failed to create session',
        includeErrorMessage: true,
      },
    },
  });

  // const { mutate: mutateDeleteThread } = useMutation({
  //   mutationFn: (id: string) => deleteThread(project.id, id),
  //   meta: {
  //     errorToast: false,
  //   },
  // });

  const { mutateAsync: mutateUpdateThread } = useMutation({
    mutationFn: (params: ThreadUpdateBody) =>
      updateThread(project.id, thread?.id ?? '', params),
    meta: {
      errorToast: {
        title: 'Failed to update the session',
        includeErrorMessage: true,
      },
    },
  });

  // const { data: runs } = useQuery({
  //   ...runsQuery(project.id, thread!.id, { limit: 100 }),
  // });

  // const pendingRuns = runs?.data.filter(
  //   (run) => run.status === 'requires_action',
  // );

  // pendingRuns?.forEach((run) => cancelRun(project.id, run.thread_id, run.id));

  // TODO: find a different solution, this is called just anytime
  // useEffect(() => {
  //   return () => {
  //     // delete empty thread, if no message was sent yet
  //     if (thread && !getMessages().length) {
  //       mutateDeleteThread(thread.id);
  //     }
  //   };
  // }, [getMessages, mutateDeleteThread, thread]);

  useEffect(() => {
    if (threadAssistant?.data) selectAssistant(threadAssistant.data);
  }, [threadAssistant, selectAssistant]);

  useEffect(() => {
    const vectorStoreId =
      thread?.tool_resources?.file_search?.vector_store_ids?.at(0);
    if (vectorStoreId) setVectorStoreId(vectorStoreId);
  }, [setVectorStoreId, thread?.tool_resources?.file_search?.vector_store_ids]);

  const setMessagesWithFilesQueryData = useCallback(
    (threadId?: string, newMessage?: MessageWithFiles | null) => {
      if (threadId) {
        queryClient.setQueryData(
          messagesWithFilesQuery(project.id, threadId).queryKey,
          (messages) =>
            (messages ? [...messages, newMessage] : [newMessage]).filter(
              isNotNull,
            ),
        );
      }
    },
    [project.id, queryClient],
  );

  const getThreadTools = useCallback(() => {
    return assistant
      ? [
          ...assistant.tools,
          ...(vectorStoreId &&
          assistant.tools.every((tool) => tool.type !== 'file_search')
            ? [FILE_SEARCH_TOOL_DEFINITION]
            : []),
          ...(isFeatureEnabled(FeatureName.FunctionTools)
            ? [GET_USER_LOCATION_FUNCTION_TOOL]
            : []),
        ]
      : [];
  }, [assistant, vectorStoreId]);

  const getUsedTools = useCallback(() => {
    return getThreadTools().filter((t) => !toolIncluded(disabledTools, t));
  }, [getThreadTools, disabledTools]);

  const cancel = useCallback(() => {
    controllerRef.current.abortController?.abort();
  }, [controllerRef]);

  const reset = useCallback(
    (messages: ChatMessage[]) => {
      controllerRef.current.abortController?.abort();
      setController(CHAT_CONTROLLER_DEFAULT);
      setMessages(messages);
      setThread(null);
      resetFiles();
    },
    [controllerRef, resetFiles, setMessages],
  );

  const clear = useCallback(() => reset([]), [reset]);

  const ensureThread = useCallback(
    async (message?: string) => {
      const toolResources = vectorStoreId
        ? { file_search: { vector_store_ids: [vectorStoreId] } }
        : undefined;

      if (thread) {
        const threadMetadata = decodeMetadata<ThreadMetadata>(thread.metadata);
        if (
          (vectorStoreId && !getThreadVectorStoreId(thread)) ||
          threadMetadata.title === ''
        ) {
          threadMetadata.title =
            threadMetadata.title === ''
              ? truncate(message, { length: THREAD_TITLE_MAX_LENGTH })
              : threadMetadata.title;

          const updatedThread = await mutateUpdateThread({
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

      const createdThread = await mutateCreateThread({
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
    [assistant, mutateCreateThread, mutateUpdateThread, thread, vectorStoreId],
  );

  ensureThreadRef.current = ensureThread;

  // create last assistant message from last run, if errored
  useEffect(() => {
    if (thread && getMessages().at(-1)?.role !== 'assistant') {
      queryClient
        .fetchQuery(
          runsQuery(project.id, thread.id, {
            limit: 1,
            order: 'desc',
            order_by: 'created_at',
          }) as FetchQueryOptions<RunsListResponse>,
        )
        .then((data) => {
          const run = data?.data.at(0);
          if (run)
            setMessages((messages) => {
              if (messages.at(-1)?.role !== 'assistant')
                messages.push({
                  role: 'assistant',
                  content: '',
                  pending: false,
                  error: Error(run.last_error?.message),
                  created_at: run.created_at ?? new Date().getTime(),
                  run_id: run.id,
                });
            });
        });
    }
  }, [thread, getMessages, setMessages, queryClient, project.id]);

  const setStatus = (status: ChatStatus) => {
    setController((controller) => ({ ...controller, status }));
  };

  const handleError = useHandleError();
  const sendMessage = useCallback(
    async (input: string, { regenerate }: SendMessageOptions = {}) => {
      if (controllerRef.current.status !== 'ready') {
        return { aborted: true, thread: null };
      }

      const abortController = new AbortController();
      setController({
        abortController,
        status: 'fetching',
      });

      function handleAborted(thread: Thread | null) {
        thread &&
          runIdRef.current &&
          mutateCancel({ threadId: thread.id, runId: runIdRef.current });

        // Remove last bot message if it was empty, and also last user message
        setMessages((messages) => {
          let message = messages.at(-1);
          let shouldRemoveUserMessage = true;
          if (message?.role === 'assistant') {
            if (!isBotMessage(message)) {
              throw new Error('Unexpected last message found.');
            }
            if (
              !message.content &&
              message.plan == null &&
              message.error == null
            ) {
              messages.pop();
              message = messages.at(-1);
            } else {
              shouldRemoveUserMessage = false;
              if (message.plan) {
                message.plan.steps = message.plan.steps.map((step) =>
                  step.status === 'in_progress'
                    ? { ...step, status: 'cancelled' }
                    : step,
                );
              }
            }
          }
          if (message?.role === 'user' && shouldRemoveUserMessage) {
            messages.pop();
          }
        });
      }

      async function handlePostMessage(
        threadId: string,
        { role, content, attachments, files }: UserChatMessage,
      ): Promise<MessageWithFiles | null> {
        const message = await createMessage(project.id, threadId, {
          role,
          content,
          attachments,
        });

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
          newMessage = await handlePostMessage(thread.id, userMessage);

          setMessagesWithFilesQueryData(thread.id, newMessage);
        }

        const tools = getUsedTools();
        // const toolApprovals = tools.reduce((toolApprovals, tool) => {
        //   const toolId = getToolUsageId(tool);

        //   if (isNotNull(toolId) && isExternalTool(tool.type, toolId)) {
        //     toolApprovals[toolId] = {
        //       require: 'always',
        //     };
        //   }

        //   return toolApprovals;
        // }, {} as NonNullable<ToolApprovals>);

        await chatStream({
          projectId: project.id,
          threadId: thread.id,
          runIdRef,
          body: {
            assistant_id: assistant.id,
            tools,
            // tool_approvals: toolApprovals,
          },
          abortController,
          setStatus,
          setMessages,
          onMessageCompleted: (response) => {
            setMessagesWithFilesQueryData(thread?.id, response.data);
          },
        });
      } catch (err) {
        handleError(err, { toast: false });
      } finally {
        const lastMessage = getMessages().at(-1);

        queryClient.invalidateQueries({
          queryKey: readRunQuery(
            project.id,
            thread?.id ?? '',
            lastMessage?.run_id ?? '',
          ).queryKey,
        });

        setController(CHAT_CONTROLLER_DEFAULT);

        setMessages((messages) => {
          const lastMessage = messages.at(-1);
          if (isBotMessage(lastMessage)) {
            lastMessage.pending = false;
          }
        });
      }

      const aborted = abortController.signal.aborted;
      if (aborted) {
        handleAborted(thread);
      }

      return {
        aborted,
        thread,
      };
    },
    [
      controllerRef,
      mutateCancel,
      setMessages,
      getMessages,
      queryClient,
      project.id,
      attachments,
      files,
      clearFiles,
      assistant,
      ensureThread,
      getUsedTools,
      setMessagesWithFilesQueryData,
      handleError,
      chatStream,
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
      getMessages,
      cancel,
      clear,
      reset,
      setMessages,
      sendMessage,
      setThread,
      setDisabledTools,
      getThreadTools,
      thread,
      assistant: {
        ...threadAssistant,
        data:
          threadAssistant.data || threadAssistant.isDeleted
            ? threadAssistant.data
            : assistant,
      },
      disabledTools,
    }),
    [
      controller.status,
      getMessages,
      cancel,
      clear,
      reset,
      setMessages,
      sendMessage,
      setDisabledTools,
      getThreadTools,
      thread,
      threadAssistant,
      assistant,
      disabledTools,
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
};

export type SendMessageResult = {
  aborted: boolean;
  thread: Thread | null;
};

type ChatContextValue = {
  status: ChatStatus;
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
  setDisabledTools: Dispatch<SetStateAction<ToolsUsage>>;
  getThreadTools: () => ToolsUsage;
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
