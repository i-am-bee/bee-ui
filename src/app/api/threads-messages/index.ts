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

import { isNotNull } from '@/utils/helpers';
import { client } from '../client';
import { readFile } from '../files';
import {
  assertSuccessResponse,
  decodeMetadata,
  getRequestHeaders,
} from '../utils';
import {
  MessageCreateBody,
  MessagesListQuery,
  MessageUpdateBody,
} from './types';
import { MessageMetadata, MessageWithFiles } from '@/modules/chat/types';

export const MESSAGES_PAGE_SIZE = 100;

export async function createMessage(
  organizationId: string,
  projectId: string,
  threadId: string,
  body: MessageCreateBody,
) {
  const res = await client.POST('/v1/threads/{thread_id}/messages', {
    params: { path: { thread_id: threadId } },
    body,
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function readMessage(
  projectId: string,
  threadId: string,
  messageId: string,
) {
  const res = await client.GET(
    '/v1/threads/{thread_id}/messages/{message_id}',
    {
      params: { path: { thread_id: threadId, message_id: messageId } },
      headers: getRequestHeaders(projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function listMessages(
  organizationId: string,
  projectId: string,
  threadId: string,
  query?: MessagesListQuery,
) {
  const res = await client.GET('/v1/threads/{thread_id}/messages', {
    params: {
      path: { thread_id: threadId },
      query: {
        order: 'asc',
        ...query,
      },
    },
    headers: getRequestHeaders(organizationId, projectId),
  });
  assertSuccessResponse(res);
  return res.data;
}

export async function listMessagesWithFiles(
  organizationId: string,
  projectId: string,
  threadId: string,
  query?: MessagesListQuery,
): Promise<MessageWithFiles[]> {
  const messages =
    (await listMessages(organizationId, projectId, threadId, query))?.data ??
    [];

  const messagesWithFiles = await Promise.all(
    messages.map(async (message) => {
      const attachments = message.attachments ?? [];

      const files = (
        await Promise.all(
          attachments?.map(async (attachment) => {
            const response = await readFile(
              organizationId,
              projectId,
              attachment.file_id,
            );

            return {
              file: response,
            };
          }),
        )
      ).filter(isNotNull);

      return {
        ...message,
        files,
      };
    }),
  );

  return messagesWithFiles;
}

export async function updateMessage(
  organizationId: string,
  projectId: string,
  threadId: string,
  messageId: string,
  body: MessageUpdateBody,
) {
  const res = await client.POST(
    '/v1/threads/{thread_id}/messages/{message_id}',
    {
      params: {
        path: {
          thread_id: threadId,
          message_id: messageId,
        },
      },
      body,
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}

export async function deleteMessage(
  organizationId: string,
  projectId: string,
  threadId: string,
  messageId: string,
) {
  const res = await client.DELETE(
    '/v1/threads/{thread_id}/messages/{message_id}',
    {
      params: { path: { thread_id: threadId, message_id: messageId } },
      headers: getRequestHeaders(organizationId, projectId),
    },
  );
  assertSuccessResponse(res);
  return res.data;
}
