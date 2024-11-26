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
  ensureAppBuilderAssistant,
  fetchAssistant,
  fetchThread,
  listMessagesWithFiles,
  MESSAGES_PAGE_SIZE,
} from '@/app/api/rsc';
import { AppBuilder } from '@/modules/apps/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/AppBuilderProvider';
import { extractCodeFromMessageContent } from '@/modules/apps/utils';
import { AssistantBuilderProvider } from '@/modules/assistants/builder/AssistantBuilderProvider';
import { Builder } from '@/modules/assistants/builder/Builder';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
    threadId: string;
  };
}

export default async function AppBuilderPage({
  params: { projectId, threadId },
}: Props) {
  const assistant = await ensureAppBuilderAssistant(projectId);
  const thread = await fetchThread(projectId, threadId);

  if (!(assistant && thread)) notFound();

  const initialMessages = await listMessagesWithFiles(projectId, threadId, {
    limit: MESSAGES_PAGE_SIZE,
  });

  return (
    <LayoutInitializer layout={{ sidebarVisible: false }}>
      <AppBuilderProvider
        code={extractCodeFromMessageContent(
          initialMessages
            .at(-1)
            ?.content.map(({ text: { value } }) => value)
            .join('') ?? '',
        )}
      >
        <AppBuilder
          assistant={assistant}
          thread={thread}
          initialMessages={initialMessages}
        />
      </AppBuilderProvider>
    </LayoutInitializer>
  );
}
