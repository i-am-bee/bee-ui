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
import { AppFrame } from './AppFrame';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';

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

  const handleMessageCompleted = useCallback((content: string) => {
    const pythonAppCode = content.match(/```python-app\n([\s\S]*?)```/)?.at(-1);
    if (pythonAppCode) setCode(pythonAppCode);
    // TODO: remove
    setCode(TEST_SOURCE_CODE);
  }, []);

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
      <section className={classes.appPane}>
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
              <AppFrame />
            </TabPanel>
            <div className={classes.appPaneContent}>
              <TabPanel key={TabsKeys.SourceCode}>
                <EditableSyntaxHighlighter
                  id={`${id}:code`}
                  value={code ?? 'No code available'}
                  onChange={setCode}
                  required
                  rows={16}
                />
              </TabPanel>
            </div>
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

const TEST_SOURCE_CODE = `import streamlit as st

st.title("Hello World App")
st.header("This is a simple Streamlit app")
st.write("Hello, world!")

name = st.text_input("What's your name?")
if name:
    st.success(f"Hello, {name}!")

button = st.button("Click me!")
if button:
    st.info("Button clicked!")
`;
