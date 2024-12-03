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
import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { ChatProvider, useChat } from '@/modules/chat/providers/ChatProvider';
import { MessageWithFiles } from '@/modules/chat/types';
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCallback, useId, useState } from 'react';
import { Assistant } from '../../assistants/types';
import { ConversationView } from '../../chat/ConversationView';
import { threadsQuery } from '../../chat/history/queries';
import { CreateAppModal } from '../manage/CreateAppModal';
import { extractCodeFromMessageContent } from '../utils';
import classes from './AppBuilder.module.scss';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { ArtifactSharedIframe } from './ArtifactSharedIframe';

interface Props {
  thread?: Thread;
  assistant: Assistant;
  initialMessages?: MessageWithFiles[];
}

export function AppBuilder({ assistant, thread, initialMessages }: Props) {
  const { project } = useAppContext();
  const queryClient = useQueryClient();
  const { setCode } = useAppBuilderApi();

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

  return (
    <ChatProvider
      assistant={{
        data: assistant,
      }}
      thread={thread}
      initialData={initialMessages}
      initialAssistantMessage="What do you want to build today?"
      onMessageCompleted={handleMessageCompleted}
    >
      <AppBuilderContent />
    </ChatProvider>
  );
}

function AppBuilderContent() {
  const [selectedTab, setSelectedTab] = useState(TabsKeys.Preview);
  const { project } = useAppContext();
  const { openModal } = useModal();
  const id = useId();
  const { getMessages } = useChat();

  const { setCode } = useAppBuilderApi();
  const { code } = useAppBuilder();

  const getLastMessageWithCode = useCallback(
    () =>
      getMessages().find((message) =>
        Boolean(extractCodeFromMessageContent(message.content)),
      ),
    [getMessages],
  );

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
                  const message = getLastMessageWithCode();

                  if (message?.id && code) {
                    openModal((props) => (
                      <CreateAppModal
                        project={project}
                        messageId={message.id ?? ''}
                        code={code}
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
              <EditableSyntaxHighlighter
                id={`${id}:code`}
                value={code ?? 'No code available'}
                onChange={setCode}
                required
                rows={16}
              />
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
