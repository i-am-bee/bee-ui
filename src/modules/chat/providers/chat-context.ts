/**
 * Copyright 2025 IBM Corp.
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

import { Thread } from '@/app/api/threads/types';
import { ToolsUsage } from '@/app/api/tools/types';
import { Updater } from '@/hooks/useImmerWithGetter';
import {
  createContext,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  use,
} from 'react';
import {
  ChatMessage,
  ThreadAssistant,
  ToolApprovalValue,
  UserChatMessage,
} from '../types';
import { AssistantBuilderState } from '@/modules/assistants/builder/Builder';
import { UseQueryResult } from '@tanstack/react-query';
import { useMessages } from '../hooks/useMessages';

export type ChatStatus = 'ready' | 'fetching' | 'waiting' | 'aborting';

export interface ChatSetup {
  topBarEnabled?: boolean;
  threadSettingsEnabled?: boolean;
  builderState?: AssistantBuilderState;
  initialAssistantMessage?: string;
  inputPlaceholder?: { initial: string; ongoing: string };
}

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
  messagesQueryControl: ReturnType<typeof useMessages>['queryControl'];
};

export const ChatContext = createContext<ChatContextValue>(
  null as unknown as ChatContextValue,
);

export const ChatMessagesContext = createContext<ChatMessage[]>([]);

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

export type SendMessageOptions = {
  regenerate?: boolean;
  onAfterRemoveSentMessage?: (message: UserChatMessage) => void;
};

export type SendMessageResult = {
  aborted: boolean;
  thread: Thread | null;
};

export interface RunController {
  abortController: AbortController | null;
  status: ChatStatus;
  runId: string | null;
}
