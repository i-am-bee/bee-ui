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

import { Container } from '@/components/Container/Container';
import { useAppContext } from '@/layout/providers/AppProvider';
import { fadeProps } from '@/utils/fadeProps';
import { isNotNull } from '@/utils/helpers';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import {
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@carbon/react';
import { ArrowUpRight, Settings } from '@carbon/react/icons';
import {
  autoUpdate,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { useChat } from '../providers/ChatProvider';
import { useFilesUpload } from '../providers/FilesUploadProvider';
import { ThreadKnowledge } from './ThreadKnowledge';
import classes from './ThreadSettings.module.scss';
import { ThreadTools } from './ThreadTools';
import { LinkButton } from '@/components/LinkButton/LinkButton';
import { useAssistantModal } from '../providers/AssistantModalProvider';

export function ThreadSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(TabsIds.TOOLS);
  const { assistant } = useAppContext();
  const { thread, threadSettingsButtonRef } = useChat();
  const { files } = useFilesUpload();
  const { openAssistantModal } = useAssistantModal();

  const { refs, floatingStyles, context } = useFloating({
    placement: 'top-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [offset(OFFSET)],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const assistantVectorStores = useMemo(
    () => [
      ...new Set(assistant?.tool_resources?.file_search?.vector_store_ids),
    ],
    [assistant?.tool_resources?.file_search?.vector_store_ids],
  );

  const threadVectorStores = useMemo(
    () => [
      ...new Set(
        [
          ...(thread?.tool_resources?.file_search?.vector_store_ids ?? []),
          ...files.map(
            ({ vectorStoreFile }) => vectorStoreFile?.vector_store_id,
          ),
        ].filter(isNotNull),
      ),
    ],
    [thread?.tool_resources?.file_search?.vector_store_ids, files],
  );

  return (
    <>
      <IconButton
        kind="ghost"
        size="sm"
        label="Customize Tools & Knowledge"
        autoAlign
        ref={mergeRefs([threadSettingsButtonRef, refs.setReference])}
        {...getReferenceProps()}
      >
        <Settings />
      </IconButton>

      <AnimatePresence>
        {isOpen && (
          <FloatingPortal>
            <FloatingFocusManager context={context}>
              <Container
                ref={refs.setFloating}
                style={floatingStyles}
                size="sm"
                className={classes.root}
                {...getFloatingProps()}
              >
                <motion.div
                  {...fadeProps({
                    hidden: {
                      transform: 'translateY(1rem)',
                    },
                    visible: {
                      transform: 'translateY(0)',
                    },
                  })}
                >
                  <div className={classes.content}>
                    <div className={classes.tabs}>
                      <Tabs
                        defaultSelectedIndex={selectedTab}
                        onChange={({ selectedIndex }) => {
                          setSelectedTab(selectedIndex);
                        }}
                      >
                        <TabList aria-label="Configuration Groups">
                          <Tab>Tools</Tab>

                          {isFeatureEnabled(FeatureName.Knowledge) ? (
                            <Tab>Knowledge</Tab>
                          ) : undefined}
                        </TabList>
                        <div>
                          <TabPanels>
                            {[
                              <TabPanel key={TabsIds.TOOLS}>
                                <ThreadTools
                                  assistantTools={assistant?.tools}
                                />
                              </TabPanel>,
                              isFeatureEnabled(FeatureName.Knowledge) ? (
                                <TabPanel key={TabsIds.KNOWLEDGE}>
                                  <ThreadKnowledge
                                    assistantVectorStores={
                                      assistantVectorStores
                                    }
                                    threadVectorStores={threadVectorStores}
                                    enableFetch={
                                      selectedTab === TabsIds.KNOWLEDGE
                                    }
                                  />
                                </TabPanel>
                              ) : null,
                            ].filter(isNotNull)}
                          </TabPanels>
                        </div>
                      </Tabs>
                    </div>

                    <div className={classes.bottom}>
                      <LinkButton
                        className={classes.link}
                        onClick={() => {
                          if (assistant) {
                            openAssistantModal(assistant);
                            setIsOpen(false);
                          }
                        }}
                      >
                        <span>View bee details</span>

                        <ArrowUpRight />
                      </LinkButton>
                    </div>
                  </div>
                </motion.div>
              </Container>
            </FloatingFocusManager>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
}

const OFFSET = {
  mainAxis: 70,
  crossAxis: -5,
};

enum TabsIds {
  TOOLS,
  KNOWLEDGE,
}
