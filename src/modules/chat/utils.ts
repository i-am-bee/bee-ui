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

import { Thread } from '@/app/api/threads/types';
import { isNotNull } from '@/utils/helpers';
import { BotChatMessage, ChatMessage, MessageWithFiles } from './types';

export function getMessagesFromThreadMessages(
  messages: MessageWithFiles[],
): ChatMessage[] {
  return messages.map(
    ({ id, role, content, attachments, files, created_at, run_id }) => {
      return {
        key: id,
        id,
        role,
        pending: false,
        content: content.map(({ text: { value } }) => value).join(''),
        attachments,
        files,
        created_at,
        run_id,
      } satisfies ChatMessage;
    },
  );
}

export function getThreadVectorStoreId(thread: Thread): string | null {
  return thread.tool_resources?.file_search?.vector_store_ids?.at(0) ?? null;
}

export function isBotMessage(
  message: ChatMessage | undefined,
): message is BotChatMessage {
  return isNotNull(message) && message.role === 'assistant';
}
