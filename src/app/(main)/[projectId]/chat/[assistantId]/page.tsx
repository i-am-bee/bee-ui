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

import { fetchAssistant } from '@/app/api/rsc';
import { ensureSession } from '@/app/auth/rsc';
import { ChatHomeView } from '@/modules/chat/ChatHomeView';
import { ChatProvider } from '@/modules/chat/providers/ChatProvider';
import { FilesUploadProvider } from '@/modules/chat/providers/FilesUploadProvider';
import { VectorStoreFilesUploadProvider } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    assistantId?: string;
    projectId: string;
  };
}

export default async function AssistantChatPage({
  params: { assistantId, projectId },
}: Props) {
  const session = await ensureSession();
  if (!session) {
    throw new Error('Session not found.');
  }
  const assistant = await fetchAssistant(
    session.userProfile.default_organization,
    projectId,
    assistantId,
  );

  if (!assistant) notFound();

  return (
    <LayoutInitializer layout={{ sidebarVisible: true }}>
      <VectorStoreFilesUploadProvider
        projectId={projectId}
        organizationId={session.userProfile.default_organization}
      >
        <FilesUploadProvider>
          <ChatProvider
            assistant={{
              data: assistant ?? null,
            }}
            topBarEnabled
            threadSettingsEnabled
          >
            <ChatHomeView />
          </ChatProvider>
        </FilesUploadProvider>
      </VectorStoreFilesUploadProvider>
    </LayoutInitializer>
  );
}
