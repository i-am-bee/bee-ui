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

import {
  fetchThread,
  fetchThreadAssistant,
  listMessagesWithFiles,
  MESSAGES_PAGE_SIZE,
} from '@/app/api/rsc';
import { ensureDefaultOrganizationId } from '@/app/auth/rsc';
import { ConversationView } from '@/modules/chat/ConversationView';
import { ChatProvider } from '@/modules/chat/providers/ChatProvider';
import { FilesUploadProvider } from '@/modules/chat/providers/FilesUploadProvider';
import { VectorStoreFilesUploadProvider } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
    threadId: string;
  };
}

export default async function ThreadPage({
  params: { projectId, threadId },
}: Props) {
  const organizationId = await ensureDefaultOrganizationId();

  const thread = await fetchThread(organizationId, projectId, threadId);

  if (!thread) notFound();

  const { assistantName, assistantId } = thread.uiMetadata;
  const threadAssistant = {
    name: assistantName,
    ...(await fetchThreadAssistant(
      organizationId,
      projectId,
      threadId,
      assistantId,
    )),
  };

  const initialMessages = await listMessagesWithFiles(
    organizationId,
    projectId,
    threadId,
    {
      limit: MESSAGES_PAGE_SIZE,
    },
  );

  return (
    <LayoutInitializer
      layout={{
        navbarProps: { type: 'chat', assistant: threadAssistant.data },
      }}
    >
      <VectorStoreFilesUploadProvider
        projectId={projectId}
        organizationId={organizationId}
      >
        <FilesUploadProvider>
          <ChatProvider
            thread={thread}
            assistant={threadAssistant}
            initialData={initialMessages}
            topBarEnabled
            threadSettingsEnabled
          >
            <ConversationView />
          </ChatProvider>
        </FilesUploadProvider>
      </VectorStoreFilesUploadProvider>
    </LayoutInitializer>
  );
}
