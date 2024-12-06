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
  fetchThread,
  listMessagesWithFiles,
  MESSAGES_PAGE_SIZE,
} from '@/app/api/rsc';
import { ensureDefaultOrganizationId, ensureSession } from '@/app/auth/rsc';
import { AppBuilder } from '@/modules/apps/builder/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/builder/AppBuilderProvider';
import { extractCodeFromMessageContent } from '@/modules/apps/utils';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';
import { getMessagesFromThreadMessages } from '@/modules/chat/utils';
import { MessageResult } from '@/app/api/threads-messages/types';
import { getAppBuilderNavbarProps } from '../../../utils';

interface Props {
  params: {
    projectId: string;
    threadId: string;
  };
}

export default async function AppBuilderPage({
  params: { projectId, threadId },
}: Props) {
  const organizationId = await ensureDefaultOrganizationId();

  const assistant = await ensureAppBuilderAssistant(organizationId, projectId);
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
    <LayoutInitializer
      layout={{ navbarProps: getAppBuilderNavbarProps(projectId) }}
    >
      <AppBuilderProvider
        code={extractCodeFromMessageContent(
          getLastMessageWithStreamlitCode(initialMessages)?.content ?? '',
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

function getLastMessageWithStreamlitCode(messages: MessageResult[]) {
  const chatMessages = getMessagesFromThreadMessages(messages);
  return chatMessages.findLast((message) =>
    Boolean(extractCodeFromMessageContent(message.content)),
  );
}
