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
import { useModal } from '@/layout/providers/ModalProvider';
import { ChatProvider, useChat } from '@/modules/chat/providers/ChatProvider';
import {
  ChatMessage,
  MessageMetadata,
  MessageWithFiles,
} from '@/modules/chat/types';
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { Assistant } from '../../assistants/types';
import { ConversationView } from '../../chat/ConversationView';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { extractCodeFromMessageContent } from '../utils';
import { useQueryClient } from '@tanstack/react-query';
import { threadsQuery } from '../../chat/history/queries';
import { CreateAppModal } from '../manage/CreateAppModal';
import { createMessage } from '@/app/api/threads-messages';
import { SourceCodeEditor } from './SourceCodeEditor';
import { decodeMetadata, encodeMetadata } from '@/app/api/utils';
import classes from './AppBuilder.module.scss';
import { ArtifactSharedIframe } from './ArtifactSharedIframe';

interface Props {
  thread?: Thread;
  assistant: Assistant;
  initialMessages?: MessageWithFiles[];
}

export function AppBuilder({ assistant, thread, initialMessages }: Props) {
  const { project } = useAppContext();
  const queryClient = useQueryClient();
  const { setCode, getCode } = useAppBuilderApi();
  const { artifact, code } = useAppBuilder();

  const handleMessageCompleted = useCallback(
    (newThread: Thread, content: string) => {
      const pythonAppCode = extractCodeFromMessageContent(content);
      if (pythonAppCode) setCode(pythonAppCode);

      if (newThread && !thread) {
        window.history.pushState(
          null,
          '',
          `/${project.id}/apps/builder/t/${newThread.id}`,
        );
        queryClient.invalidateQueries({
          queryKey: threadsQuery(project.id).queryKey,
        });
      }
    },
    [project.id, queryClient, setCode, thread],
  );

  const handleBeforePostMessage = useCallback(
    async (thread: Thread, messages: ChatMessage[]) => {
      const lastMessage = getLastMessageWithCode(messages);
      const lastMessageCode = extractCodeFromMessageContent(
        lastMessage?.content ?? '',
      );
      const currentCode = getCode();
      const isCodeModified =
        lastMessageCode && currentCode && lastMessageCode !== currentCode;
      const isCloneFirstMessage = currentCode && messages.length === 2;
      if (isCodeModified || isCloneFirstMessage) {
        const instruction = isCodeModified
          ? 'I have edited the source code to'
          : 'I want to continue working on this source code';
        await createMessage(project.id, thread.id, {
          role: 'user',
          content: `${instruction}:\n\`\`\`python-app\n${currentCode}\n\`\`\``,
          metadata: encodeMetadata<MessageMetadata>({ type: 'code-update' }),
        });
      }
    },
    [getCode, project.id],
  );

  const isCloneAppThread = (() => {
    const isInitialCloneState = code && !artifact && !initialMessages?.length;
    const firstMessage = initialMessages?.at(0);
    const isThreadWithClonedApp = firstMessage
      ? decodeMetadata<MessageMetadata>(firstMessage.metadata).type ===
        'code-update'
      : false;

    return isInitialCloneState || isThreadWithClonedApp;
  })();

  return (
    <ChatProvider
      assistant={{
        data: assistant,
      }}
      thread={thread}
      initialData={initialMessages}
      initialAssistantMessage={
        isCloneAppThread
          ? 'How do you want to edit this app? Do you need suggestions?'
          : 'What do you want to build today?'
      }
      onMessageCompleted={handleMessageCompleted}
      onBeforePostMessage={handleBeforePostMessage}
    >
      <AppBuilderContent />
    </ChatProvider>
  );
}

function AppBuilderContent() {
  const [selectedTab, setSelectedTab] = useState(TabsKeys.Preview);
  const { project } = useAppContext();
  const { openModal } = useModal();
  const { getMessages } = useChat();

  const { setArtifact } = useAppBuilderApi();
  const { code } = useAppBuilder();

  return (
    <div className={classes.root}>
      <section className={classes.chat}>
        <ConversationView />
      </section>
      <section
        className={clsx(classes.appPane, { [classes.empty]: code == null })}
      >
        <Tabs
          defaultSelectedIndex={selectedTab}
          onChange={({ selectedIndex }) => {
            setSelectedTab(selectedIndex);
          }}
        >
          <div className={classes.appPaneHeader}>
            <TabList aria-label="App View mode">
              <Tab>UI Preview</Tab>
              <Tab>Source code</Tab>
            </TabList>
            <div className={classes.appActions}>
              <Button
                kind="secondary"
                size="sm"
                onClick={() => {
                  const message = getLastMessageWithCode(getMessages());

                  if (message?.id && code) {
                    openModal((props) => (
                      <CreateAppModal
                        project={project}
                        messageId={message.id ?? ''}
                        code={code}
                        onCreateArtifact={setArtifact}
                        {...props}
                      />
                    ));
                  }
                }}
              >
                Save to Apps
              </Button>
            </div>
          </div>
          <TabPanels>
            <TabPanel key={TabsKeys.Preview}>
              <ArtifactSharedIframe />
            </TabPanel>
            <TabPanel key={TabsKeys.SourceCode}>
              <SourceCodeEditor />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>
    </div>
  );
}

enum TabsKeys {
  Preview,
  SourceCode,
}

export function getLastMessageWithCode(messages: ChatMessage[]) {
  return messages.find((message) =>
    Boolean(extractCodeFromMessageContent(message.content)),
  );
}
