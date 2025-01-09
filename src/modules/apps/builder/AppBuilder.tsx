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
import { getAppBuilderNavbarProps } from '@/app/(main)/[projectId]/apps/utils';
import { createMessage } from '@/app/api/threads-messages';
import { Thread } from '@/app/api/threads/types';
import { decodeMetadata, encodeMetadata } from '@/app/api/utils';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useModal } from '@/layout/providers/ModalProvider';
import { NavbarHeading } from '@/layout/shell/Navbar';
import { ChatProvider, useChat } from '@/modules/chat/providers/ChatProvider';
import {
  ChatMessage,
  MessageMetadata,
  MessageWithFiles,
  UserChatMessage,
} from '@/modules/chat/types';
import { useLayoutActions } from '@/store/layout';
import { isNotNull } from '@/utils/helpers';
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { ArrowLeft, Share } from '@carbon/react/icons';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useRouter } from 'next-nprogress-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Assistant } from '../../assistants/types';
import { ConversationView } from '../../chat/ConversationView';
import { threadsQuery } from '../../chat/history/queries';
import { AppIcon } from '../AppIcon';
import { useArtifactsCount } from '../hooks/useArtifactsCount';
import { SaveAppModal } from '../manage/SaveAppModal';
import { ShareAppModal } from '../ShareAppModal';
import { ArtifactMetadata } from '../types';
import { extractCodeFromMessageContent } from '../utils';
import classes from './AppBuilder.module.scss';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { ArtifactSharedIframe } from './ArtifactSharedIframe';
import { SourceCodeEditor } from './SourceCodeEditor';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isBotMessage, isUserMessage } from '@/modules/chat/utils';

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

  const isXlgDown = useBreakpoint('xlgDown');

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

  const handleMessageContentUpdated = useCallback(
    (message: string) => {
      const pythonAppCode = extractCodeFromMessageContent(message);
      if (pythonAppCode) setCode(pythonAppCode);
    },
    [setCode],
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

  const isEditAppThread = (() => {
    const isInitialCloneState = code && !artifact && !initialMessages?.length;
    const firstMessage = initialMessages?.at(0);
    const isThreadWithClonedApp = firstMessage
      ? decodeMetadata<MessageMetadata>(firstMessage.metadata).type ===
        'code-update'
      : false;
    const isAppWithoutThread = artifact && !initialMessages?.length;

    return isInitialCloneState || isThreadWithClonedApp || isAppWithoutThread;
  })();

  return (
    <ChatProvider
      assistant={{
        data: assistant,
      }}
      thread={thread}
      initialData={initialMessages}
      initialAssistantMessage={
        isEditAppThread
          ? 'Hello! Let me know if you want to change anything about this app.'
          : 'Hello! Describe the app you want to build.'
      }
      inputPlaceholder={{
        initial: isEditAppThread
          ? isXlgDown
            ? 'Describe the changes to the app'
            : 'Describe what this app should do or what you want to change about this app.'
          : isXlgDown
            ? 'Describe how your app should work'
            : 'Outline what your app should do and how it should work.',
        ongoing: isXlgDown
          ? 'Describe the changes to the app.'
          : 'Describe the changes you want to make to this app.',
      }}
      onMessageCompleted={handleMessageCompleted}
      onBeforePostMessage={handleBeforePostMessage}
      onMessageDeltaEventResponse={handleMessageContentUpdated}
    >
      <AppBuilderContent />
    </ChatProvider>
  );
}

function AppBuilderContent() {
  const [selectedTab, setSelectedTab] = useState(TabsKeys.Preview);

  const router = useRouter();
  const { project, organization } = useAppContext();
  const { openModal } = useModal();
  const { getMessages, sendMessage } = useChat();
  const { setArtifact, setMobilePreviewOpen } = useAppBuilderApi();
  const { code, artifact, mobilePreviewOpen, isSharedClone } = useAppBuilder();
  const { setLayout } = useLayoutActions();

  const totalCount = useArtifactsCount();

  const message = getLastMessageWithCode(getMessages());

  const additionalMetadata: ArtifactMetadata = useMemo(
    () => ({
      // when updating copy origin over, when creating new value depends whenever this is from shared link or not
      origin:
        artifact != null
          ? artifact.uiMetadata.origin
          : isSharedClone
            ? 'share'
            : 'new',
    }),
    [artifact, isSharedClone],
  );

  const icon = artifact?.uiMetadata.icon;

  const isCodePending = message?.pending;
  useEffect(() => {
    setSelectedTab(isCodePending ? TabsKeys.SourceCode : TabsKeys.Preview);
  }, [isCodePending]);

  useEffect(() => {
    const navbarProps = getAppBuilderNavbarProps(
      project.id,
      artifact ?? undefined,
    );

    setLayout({
      navbarProps: {
        ...navbarProps,
        backButton: {
          ...navbarProps.backButton,
          onClick: () => {
            const isFirstNewApp = !artifact && !totalCount && code;
            const hasUnsavedChanges = artifact && artifact.source_code !== code;

            if (isFirstNewApp || hasUnsavedChanges) {
              openModal((props) => (
                <SaveAppModal
                  artifact={artifact}
                  messageId={message?.id}
                  code={code ?? undefined}
                  onSaveSuccess={setArtifact}
                  isConfirmation
                  additionalMetadata={additionalMetadata}
                  {...props}
                />
              ));
              return;
            }

            router.push(navbarProps.backButton.url);
          },
        },
      },
    });
  }, [
    artifact,
    additionalMetadata,
    code,
    message?.id,
    openModal,
    organization,
    project,
    project.id,
    router,
    setArtifact,
    setLayout,
    totalCount,
  ]);

  const handleFixError = useCallback(
    async (errorText: string) => {
      await sendMessage(
        `I have encountered the following error:\n\n\`\`\`error\n${errorText}\n\`\`\`\n\nFix this error please.`,
      );
    },
    [sendMessage],
  );

  return (
    <div
      className={clsx(classes.root, {
        [classes.mobilePreviewOpen]: mobilePreviewOpen,
      })}
    >
      <section className={classes.chat}>
        <ConversationView
          onShowMobilePreviewButtonClick={
            isNotNull(code) ? () => setMobilePreviewOpen(true) : undefined
          }
        />
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
          {code !== null && (
            <div className={classes.appPaneHeader}>
              <div className={classes.appPaneHeaderMobile}>
                <Button
                  size="sm"
                  kind="tertiary"
                  onClick={() => setMobilePreviewOpen(false)}
                >
                  <ArrowLeft />
                </Button>

                {artifact && (
                  <NavbarHeading
                    items={[
                      {
                        title: artifact.name,
                        icon: icon ? <AppIcon name={icon} /> : null,
                      },
                    ]}
                  />
                )}
              </div>

              <TabList aria-label="App View mode">
                <Tab>UI Preview</Tab>
                <Tab>Source code</Tab>
              </TabList>
              <div className={classes.appActions}>
                <Tooltip
                  content={artifact ? 'Share' : 'Save to share'}
                  placement="bottom-start"
                  size="sm"
                  asChild
                >
                  <Button
                    className={classes.shareButton}
                    kind="tertiary"
                    size="sm"
                    align="bottom"
                    disabled={!artifact}
                    onClick={
                      artifact
                        ? () =>
                            openModal((props) => (
                              <ShareAppModal
                                {...props}
                                artifact={artifact}
                                onSuccess={setArtifact}
                              />
                            ))
                        : undefined
                    }
                  >
                    <Share />
                  </Button>
                </Tooltip>

                <Button
                  kind="secondary"
                  size="sm"
                  onClick={() => {
                    if (code) {
                      openModal((props) => (
                        <SaveAppModal
                          artifact={artifact}
                          messageId={message?.id}
                          code={code}
                          onSaveSuccess={setArtifact}
                          additionalMetadata={additionalMetadata}
                          {...props}
                        />
                      ));
                    }
                  }}
                  disabled={!code}
                >
                  Save to Apps
                </Button>
              </div>
            </div>
          )}
          <TabPanels>
            <TabPanel key={TabsKeys.Preview}>
              <ArtifactSharedIframe
                sourceCode={code}
                onFixError={handleFixError}
                isPending={isCodePending}
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
  const lastMessage = messages.findLast((message) =>
    Boolean(extractCodeFromMessageContent(message.content)),
  );
  return isBotMessage(lastMessage) ? lastMessage : undefined;
}
