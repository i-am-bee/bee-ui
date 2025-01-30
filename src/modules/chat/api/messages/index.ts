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

import { MessagesListQuery } from '@/app/api/threads-messages/types';
import { MessageWithFilesResponse } from '../../types';
import { listMessages } from '@/app/api/threads-messages';
import { readFile } from '@/app/api/files';
import { isNotNull } from '@/utils/helpers';

export async function listMessagesWithFiles(
  organizationId: string,
  projectId: string,
  threadId: string,
  query?: MessagesListQuery,
): Promise<MessageWithFilesResponse | undefined> {
  const response = await listMessages(
    organizationId,
    projectId,
    threadId,
    query,
  );
  if (!response) return response;

  const { data, ...responseWithoutData } = response;

  const messagesWithFiles = await Promise.all(
    data.map(async (message) => {
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

  return { ...responseWithoutData, data: messagesWithFiles };
}
