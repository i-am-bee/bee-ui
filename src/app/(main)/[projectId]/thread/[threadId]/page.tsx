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

import { ApiError } from '@/app/api/errors';
import {
  listMessagesWithFiles,
  listRuns,
  MESSAGES_PAGE_SIZE,
  readAssistant,
  readThread,
} from '@/app/api/rsc';
import { ThreadMetadata } from '@/app/api/threads/types';
import { decodeMetadata } from '@/app/api/utils';
import { ErrorPage } from '@/components/ErrorPage/ErrorPage';
import { getAssistantFromAssistantResult } from '@/modules/assistants/utils';
import { ConversationView } from '@/modules/chat/ConversationView';
import { ChatProvider } from '@/modules/chat/providers/ChatProvider';
import { FilesUploadProvider } from '@/modules/chat/providers/FilesUploadProvider';
import { ThreadAssistant } from '@/modules/chat/types';
import { VectorStoreFilesUploadProvider } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { handleApiError } from '@/utils/handleApiError';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    threadId: string;
    projectId: string;
  };
}

export default async function ThreadPage({
  params: { threadId, projectId },
}: Props) {
  let thread, assistantResult;
  try {
    thread = await readThread(projectId, threadId);
    if (!thread) notFound();
  } catch (e) {
    const apiError = handleApiError(e);

    if (apiError) {
      return (
        <ErrorPage
          statusCode={apiError.error.code}
          title={apiError.error.message}
        />
      );
    }

    return null;
  }

  const { assistantId: threadAssistantId, assistantName } =
    decodeMetadata<ThreadMetadata>(thread?.metadata ?? {});
  let threadAssistant: ThreadAssistant = { name: assistantName, data: null };
  try {
    let assistantId = threadAssistantId;
    if (!assistantId) {
      const lastRunResult = await listRuns(projectId, thread.id, {
        limit: 1,
        order: 'desc',
        order_by: 'created_at',
      });
      assistantId = lastRunResult?.data.at(0)?.assistant_id;
    }

    if (assistantId)
      assistantResult = await readAssistant(projectId, assistantId);
    if (assistantResult) {
      threadAssistant.data = getAssistantFromAssistantResult(assistantResult);
    }
  } catch (e) {
    if (e instanceof ApiError && e.code === 'not_found') {
      threadAssistant.isDeleted = true;
    } else {
      const apiError = handleApiError(e);

      if (apiError) {
        return (
          <ErrorPage
            statusCode={apiError.error.code}
            title={apiError.error.message}
          />
        );
      }
    }
  }

  const initialMessages = await listMessagesWithFiles(projectId, threadId, {
    limit: MESSAGES_PAGE_SIZE,
  });

  return (
    <VectorStoreFilesUploadProvider projectId={projectId}>
      <FilesUploadProvider>
        <ChatProvider
          thread={thread}
          threadAssistant={threadAssistant}
          initialData={initialMessages}
        >
          <ConversationView />
        </ChatProvider>
      </FilesUploadProvider>
    </VectorStoreFilesUploadProvider>
  );
}
