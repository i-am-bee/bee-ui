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
import { ensureDefaultOrganizationId } from '@/app/auth/rsc';
import { ChatHomeView } from '@/modules/chat/ChatHomeView';
import { ChatProvider } from '@/modules/chat/providers/ChatProvider';
import { FilesUploadProvider } from '@/modules/chat/providers/FilesUploadProvider';
import { VectorStoreFilesUploadProvider } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{
    assistantId?: string;
    projectId: string;
  }>;
}

export default async function AssistantChatPage(props: Props) {
  const { assistantId, projectId } = await props.params;

  const organizationId = await ensureDefaultOrganizationId();

  const assistant = await fetchAssistant(
    organizationId,
    projectId,
    assistantId,
  );

  if (!assistant) notFound();

  return (
    <LayoutInitializer layout={{ navbarProps: { type: 'chat', assistant } }}>
      <VectorStoreFilesUploadProvider
        projectId={projectId}
        organizationId={organizationId}
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
