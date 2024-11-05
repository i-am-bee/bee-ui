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
import { AssistantBuilderProvider } from '@/modules/assistants/builder/AssistantBuilderProvider';
import { Builder } from '@/modules/assistants/builder/Builder';
import { Assistant } from '@/modules/assistants/types';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { handleApiError } from '@/utils/handleApiError';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    assistantId?: string;
    projectId: string;
  };
}

export default async function AssistantBuildePage({
  params: { assistantId, projectId },
}: Props) {
  let assistant;
  if (assistantId) {
    try {
      const result = await readAssistant(projectId, assistantId);
      if (!result) notFound();

      assistant = decodeEntityWithMetadata<Assistant>(result);
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

  return (
    <LayoutInitializer layout={{ sidebarVisible: false }}>
      <AssistantBuilderProvider assistant={assistant}>
        <Builder />
      </AssistantBuilderProvider>
    </LayoutInitializer>
  );
}
