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
import { Assistant } from '../assistants/types';
import { RunMetadata, ThreadRun } from '@/app/api/threads-runs/types';
import { RunSetup } from '../assistants/builder/Builder';
import { getToolReferenceFromToolUsage } from '../tools/utils';
import { ToolReference } from '@/app/api/tools/types';

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

export function getRunResources(
  thread: Thread | null,
  assistant: Assistant,
): RunMetadata['resources'] {
  const assistantVectorStoreId =
    assistant.tool_resources?.file_search?.vector_store_ids?.at(0);
  const threadVectorStoreId =
    thread?.tool_resources?.file_search?.vector_store_ids?.at(0);

  return {
    ...(assistantVectorStoreId
      ? { assistant: { vectorStoreId: assistantVectorStoreId } }
      : null),
    ...(threadVectorStoreId
      ? { thread: { vectorStoreId: threadVectorStoreId } }
      : null),
  };
}

export function getRunSetup({
  instructions,
  tools,
  uiMetadata: { resources },
}: ThreadRun): RunSetup {
  return {
    instructions,
    tools: tools.map((item) => getToolReferenceFromToolUsage(item)),
    resources,
  };
}

export function getNewRunSetup(
  assistant: Assistant,
  thread: Thread | null,
): RunSetup {
  return {
    instructions: assistant.instructions,
    tools: [
      ...assistant.tools.map((item) => getToolReferenceFromToolUsage(item)),
      ...getToolsFromThread(thread),
    ],
    resources: getRunResources(thread, assistant),
  };
}

export function getToolsFromThread(thread: Thread | null): ToolReference[] {
  if (thread?.tool_resources?.file_search)
    return [{ type: 'file_search', id: 'file_search' }];

  return [];
}
