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

'use client';
import { Thread } from '@/app/api/threads/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ChatHomeView } from '@/modules/chat/ChatHomeView';
import { ChatProvider, useChat } from '@/modules/chat/providers/ChatProvider';
import { MessageWithFiles } from '@/modules/chat/types';
import { Button } from '@carbon/react';
import { useId } from 'react';
import classes from './AppBuilder.module.scss';
import { Assistant } from '../assistants/types';
import { FilesUploadProvider } from '../chat/providers/FilesUploadProvider';
import { ConversationView } from '../chat/ConversationView';

interface Props {
  thread?: Thread;
  assistant: Assistant;
  initialMessages?: MessageWithFiles[];
}

export function AppBuilder({ assistant, thread, initialMessages }: Props) {
  return (
    <div className={classes.root}>
      <section className={classes.chat}>
        <ChatProvider
          assistant={{
            data: assistant,
          }}
          thread={thread}
          initialData={initialMessages}
          initialAssistantMessage="What do you want to build today?"
        >
          <BuilderChat />
        </ChatProvider>
      </section>
      <section className={classes.app}>Place for the app...</section>
    </div>
  );
}

function BuilderChat() {
  const { thread, assistant, reset, getMessages } = useChat();
  const { project } = useAppContext();

  return (
    <>
      <ConversationView />
    </>
  );
}
