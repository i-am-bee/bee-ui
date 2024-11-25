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
import { createAssistant, listAssistants, readAssistant } from '@/app/api/rsc';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { AppBuilder } from '@/modules/apps/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/AppBuilderProvider';
import { Assistant } from '@/modules/assistants/types';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { handleApiError } from '@/utils/handleApiError';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function AppsBuilderPage({
  params: { projectId },
}: Props) {
  const assistant = await ensureAppBuilderAssistant(projectId);
  if (!assistant) notFound();

  return (
    <LayoutInitializer layout={{ sidebarVisible: false }}>
      <AppBuilderProvider>
        <AppBuilder assistant={assistant} />
      </AppBuilderProvider>
    </LayoutInitializer>
  );
}

async function ensureAppBuilderAssistant(projectId: string) {
  let result = null;
  try {
    result = (
      await listAssistants(projectId, { limit: 1, agent: 'streamlit' })
    )?.data.at(0);

    if (!result) {
      result = await createAssistant(projectId, {
        agent: 'streamlit',
        name: 'App Builder',
        tool_resources: {},
        // tools: [],
      });
    }
  } catch (error) {
    const apiError = handleApiError(error);

    if (apiError) {
      throw new ApiError(null, apiError);
    }
  }

  return result ? decodeEntityWithMetadata<Assistant>(result) : null;
}
