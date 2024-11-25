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
import { ChatProvider } from '@/modules/chat/providers/ChatProvider';
import { MessageWithFiles } from '@/modules/chat/types';
import {
  Tab,
  TabContent,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@carbon/react';
import { useCallback, useId, useState } from 'react';
import classes from './AppBuilder.module.scss';
import { Assistant } from '../assistants/types';
import { ConversationView } from '../chat/ConversationView';
import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import { StliteFrame } from './StliteFrame';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import clsx from 'clsx';
import { extractCodeFromMessageContent } from './utils';

interface Props {
  thread?: Thread;
  assistant: Assistant;
  initialMessages?: MessageWithFiles[];
}

export function AppBuilder({ assistant, thread, initialMessages }: Props) {
  const [selectedTab, setSelectedTab] = useState(TabsKeys.Preview);
  const id = useId();

  const { setCode } = useAppBuilderApi();
  const { code } = useAppBuilder();

  const handleMessageCompleted = useCallback(
    (content: string) => {
      const pythonAppCode = extractCodeFromMessageContent(content);
      if (pythonAppCode) setCode(pythonAppCode);
    },
    [setCode],
  );

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
          onMessageCompleted={handleMessageCompleted}
        >
          <ConversationView />
        </ChatProvider>
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
          <TabList aria-label="App View mode">
            <Tab>UI Preview</Tab>
            <Tab>Source code</Tab>
          </TabList>
          <TabPanels>
            <TabPanel key={TabsKeys.Preview}>
              <StliteFrame />
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
