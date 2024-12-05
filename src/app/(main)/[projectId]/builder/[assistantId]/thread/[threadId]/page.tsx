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
  fetchAssistant,
  fetchThread,
  listMessagesWithFiles,
  MESSAGES_PAGE_SIZE,
} from '@/app/api/rsc';
import { ensureDefaultOrganizationId, ensureSession } from '@/app/auth/rsc';
import { AssistantBuilderProvider } from '@/modules/assistants/builder/AssistantBuilderProvider';
import { Builder } from '@/modules/assistants/builder/Builder';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
    threadId: string;
    assistantId: string;
  };
}

export default async function AssistantBuilderPage({
  params: { projectId, threadId, assistantId },
}: Props) {
  const organizationId = await ensureDefaultOrganizationId();

  const assistant = await fetchAssistant(
    organizationId,
    projectId,
    assistantId,
  );
  const thread = await fetchThread(organizationId, projectId, threadId);

  if (!(assistant && thread)) notFound();

  const initialMessages = await listMessagesWithFiles(
    organizationId,
    projectId,
    threadId,
    {
      limit: MESSAGES_PAGE_SIZE,
    },
  );

  return (
    <LayoutInitializer layout={{ sidebarVisible: false, navbarProps: null }}>
      <AssistantBuilderProvider assistant={assistant}>
        <Builder thread={thread} initialMessages={initialMessages} />
      </AssistantBuilderProvider>
    </LayoutInitializer>
  );
}
