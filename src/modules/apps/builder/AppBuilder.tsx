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
import { createMessage } from '@/app/api/threads-messages';
import { Thread } from '@/app/api/threads/types';
import { decodeMetadata, encodeMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { ChatProvider, useChat } from '@/modules/chat/providers/ChatProvider';
import {
  ChatMessage,
  MessageMetadata,
  MessageWithFiles,
} from '@/modules/chat/types';
import {
  Button,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@carbon/react';
import { Share } from '@carbon/react/icons';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { Assistant } from '../../assistants/types';
import { ConversationView } from '../../chat/ConversationView';
import { threadsQuery } from '../../chat/history/queries';
import { SaveAppModal } from '../manage/SaveAppModal';
import { ShareAppModal } from '../ShareAppModal';
import { extractCodeFromMessageContent } from '../utils';
import classes from './AppBuilder.module.scss';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { ArtifactSharedIframe } from './ArtifactSharedIframe';
import { SourceCodeEditor } from './SourceCodeEditor';

interface Props {
  thread?: Thread;
  assistant: Assistant;
  initialMessages?: MessageWithFiles[];
}

export function AppBuilder({ assistant, thread, initialMessages }: Props) {
  const { project, organization } = useAppContext();
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
          queryKey: threadsQuery(organization.id, project.id).queryKey,
        });
      }
    },
    [organization.id, project.id, queryClient, setCode, thread],
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
        await createMessage(organization.id, project.id, thread.id, {
          role: 'user',
          content: `${instruction}:\n\`\`\`python-app\n${currentCode}\n\`\`\``,
          metadata: encodeMetadata<MessageMetadata>({ type: 'code-update' }),
        });
      }
    },
    [getCode, organization.id, project.id],
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
          ? 'Hello! Let me know if you want to change anything about this app.'
          : 'Hello! Describe the app you want to build.'
      }
      inputPlaceholder={{
        initial: isCloneAppThread
          ? 'Describe what this app should do or what you want to change about this app.'
          : 'Outline what your app should do and how it should work.',
        ongoing: 'Describe the change(s) you want to make to this app.',
      }}
      onMessageCompleted={handleMessageCompleted}
      onBeforePostMessage={handleBeforePostMessage}
    >
      <AppBuilderContent />
    </ChatProvider>
  );
}

function AppBuilderContent() {
  const [selectedTab, setSelectedTab] = useState(TabsKeys.Preview);
  const { project, organization } = useAppContext();
  const { openModal } = useModal();
  const { getMessages } = useChat();

  const { setArtifact } = useAppBuilderApi();
  const { code, artifact } = useAppBuilder();

  const message = getLastMessageWithCode(getMessages());

  const { sendMessage, thread } = useChat();

  const handleReportError = useCallback(
    async (errorText: string) => {
      await createMessage(organization.id, project.id, thread!.id, {
        role: 'user',
        content: `I have encountered the following error: \`\`\`error\n${errorText}\n\`\`\``,
        metadata: encodeMetadata<MessageMetadata>({ type: 'report-error' }),
      });
      await sendMessage(`Help me fix the attached error.`);
    },
    [organization, project, thread, sendMessage],
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
          selectedIndex={selectedTab}
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
              {artifact && (
                <IconButton
                  label="Share"
                  kind="tertiary"
                  size="sm"
                  align="bottom"
                  onClick={() =>
                    openModal((props) => (
                      <ShareAppModal
                        {...props}
                        artifact={artifact}
                        project={project}
                        organization={organization}
                        onSuccess={setArtifact}
                      />
                    ))
                  }
                >
                  <Share />
                </IconButton>
              )}
              <Button
                kind="secondary"
                size="sm"
                onClick={() => {
                  if (message?.id && code) {
                    openModal((props) => (
                      <SaveAppModal
                        organization={organization}
                        artifact={artifact}
                        project={project}
                        messageId={message.id ?? ''}
                        code={code}
                        onSaveSuccess={setArtifact}
                        {...props}
                      />
                    ));
                  }
                }}
                disabled={!(message?.id && code)}
              >
                Save to Apps
              </Button>
            </div>
          </div>
          <TabPanels>
            <TabPanel key={TabsKeys.Preview}>
              <ArtifactSharedIframe
                sourceCode={code}
                onReportError={handleReportError}
              />
            </TabPanel>
            <TabPanel key={TabsKeys.SourceCode}>
              <SourceCodeEditor
                onSaveCode={() => setSelectedTab(TabsKeys.Preview)}
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

export function getLastMessageWithCode(messages: ChatMessage[]) {
  return messages.find((message) =>
    Boolean(extractCodeFromMessageContent(message.content)),
  );
}
