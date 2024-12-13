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

import { deleteMessage } from '@/app/api/threads-messages';
import { useToast } from '@/layout/providers/ToastProvider';
import { useMutation } from '@tanstack/react-query';
import { v4 as uuid } from 'uuid';
import { useChat } from '../providers/ChatProvider';
import { ChatMessage } from '../types';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

export function useRetry(message: ChatMessage) {
  const { status, thread, sendMessage, getMessages, setMessages } = useChat();
  const { addToast } = useToast();
  const { project, organization } = useProjectContext();

  const { mutateAsync, isPending: isDeleting } = useMutation({
    mutationFn: ({ threadId, messageId }: DeleteMutationParams) =>
      deleteMessage(organization.id, project.id, threadId, messageId),
  });

  const retry = async () => {
    let messages = getMessages();
    const lastMessage = messages.at(-1);
    const lastUserMessage = messages.findLast((item) => item.role === 'user');

    if (message.id && message.id !== lastMessage?.id) {
      addToast({
        title: 'Only the last message in the thread can be regenerated.',
      });
      return;
    }

    try {
      if (lastMessage?.role === 'assistant') {
        if (thread && lastMessage.id) {
          await mutateAsync({
            threadId: thread.id,
            messageId: lastMessage.id,
          });
        }

        setMessages((messages) => {
          messages.pop();
        });
      }

      const input = lastUserMessage?.content ?? '';
      sendMessage(input, { regenerate: true });
    } catch (e) {
      setMessages((messages) => {
        const lastMessage = messages.at(-1);
        if (lastMessage?.role === 'assistant') {
          lastMessage.error = Error('Regeneration failed');
        } else {
          messages.push({
            key: uuid(),
            role: 'assistant',
            pending: false,
            content: '',
            error: Error('Regeneration failed'),
            created_at: new Date().getTime(),
          });
        }
      });
    }
  };
  return { pending: status !== 'ready', retry, isDeleting };
}

interface DeleteMutationParams {
  threadId: string;
  messageId: string;
}
