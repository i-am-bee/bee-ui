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

import { readAssistant } from '@/app/api/rsc';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { ErrorPage } from '@/components/ErrorPage/ErrorPage';
import { Assistant } from '@/modules/assistants/types';
import { ChatHomeView } from '@/modules/chat/ChatHomeView';
import { ChatProvider } from '@/modules/chat/providers/ChatProvider';
import { FilesUploadProvider } from '@/modules/chat/providers/FilesUploadProvider';
import { VectorStoreFilesUploadProvider } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { handleApiError } from '@/utils/handleApiError';
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
  let assistantResult;
  if (assistantId) {
    try {
      assistantResult = await readAssistant(projectId, assistantId);
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
    }
  }
  if (!assistantResult) notFound();

  return (
    <LayoutInitializer layout={{ sidebarVisible: true }}>
      <VectorStoreFilesUploadProvider projectId={projectId}>
        <FilesUploadProvider>
          <ChatProvider
            assistant={{
              data:
                decodeEntityWithMetadata<Assistant>(assistantResult) ?? null,
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
