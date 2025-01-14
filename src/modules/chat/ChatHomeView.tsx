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
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next-nprogress-bar';
import { useEffect } from 'react';
import { ConversationView } from './ConversationView';
import { EmptyChatView } from './EmptyChatView';
import { threadsQuery } from './history/queries';
import { Thread } from '@/app/api/threads/types';
import { ChatMessage } from './types';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  SendMessageResult,
  useChat,
  useChatMessages,
} from './providers/chat-context';

export interface ChatState {
  thread: Thread;
  messages: ChatMessage[];
}

export function ChatHomeView() {
  const { getMessages, clear, reset, setThread, builderState, assistant } =
    useChat();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { project, organization } = useAppContext();
  const handleMessageSent = ({ thread }: SendMessageResult) => {
    if (thread) {
      // We could use normal nextjs router and navigate to /thread/[threadId] page
      // however that has a problem that a) it unneccesarilly retrieves conversation
      // messages even though we already have them, but b) most importantly
      // messages from api doesn't have a plan so we would loose that.
      // So instead we use history api manually and handle 'popstate' event.
      // Nextjs since 14.1 expects history can be used directly so we are not
      // bypassing nextjs entirelly.
      window.history.pushState(
        {
          chat: {
            thread,
            messages: getMessages(),
          } satisfies ChatState,
        },
        '',
        `/${project.id}${builderState ? `/builder/${assistant.data?.id}` : ''}/thread/${thread.id}`,
      );
      queryClient.invalidateQueries({
        queryKey: threadsQuery(organization.id, project.id).queryKey,
      });
    }
  };

  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      if (!e.state || !e.state.chat) {
        clear();
      } else {
        const chatState = e.state.chat as ChatState;
        setThread(chatState.thread);
        reset(chatState.messages);
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [clear, setThread, reset, router]);

  const messages = useChatMessages();
  if (!messages.length) {
    return <EmptyChatView onMessageSent={handleMessageSent} />;
  }
  return <ConversationView />;
}
