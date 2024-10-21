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

import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { InstructionsTextArea } from '@/modules/assistants/builder/InstructionsTextArea';
import { prelistVectorStores } from '@/modules/knowledge/queries';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { prelistTools } from '@/modules/tools/queries';
import { isNotNull } from '@/utils/helpers';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { Button, Tab, TabList, TabPanel, TabPanels, Tabs } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ToolsList } from '../tools/ToolsList';
import classes from './AssistantForm.module.scss';
import { KnowledgeSelector } from './KnowledgeSelector';
import { StarterQuestionsTextArea } from './StarterQuestionsTextArea';

export function AssistantForm() {
  const searchParams = useSearchParams();
  const tabId = searchParams?.get('tabId');
  const [selectedTab, setSelectedTab] = useState(
    isNotNull(tabId) ? parseInt(tabId) : TabsIds.SETTINGS,
  );
  const queryClient = useQueryClient();
  const { openModal } = useModal();
  const { isProjectReadOnly, project } = useAppContext();

  return (
    <div className={classes.form}>
      <div className={classes.tabs}>
        <Tabs
          defaultSelectedIndex={selectedTab}
          onChange={({ selectedIndex }) => {
            setSelectedTab(selectedIndex);
          }}
        >
          <TabList aria-label="Configuration Groups">
            <Tab>Settings</Tab>
            <Tab onMouseEnter={() => prelistTools(project.id, queryClient)}>
              Tools
            </Tab>
            {isFeatureEnabled(FeatureName.Knowledge) && (
              <Tab
                onMouseEnter={() => {
                  prelistVectorStores(project.id, queryClient);
                }}
              >
                Knowledge
              </Tab>
            )}
          </TabList>
          <TabPanels>
            <TabPanel>
              <SettingsFormGroup>
                <InstructionsTextArea />

                {/* <StarterQuestionsTextArea /> */}
              </SettingsFormGroup>
            </TabPanel>
            <TabPanel>
              <SettingsFormGroup>
                <Button
                  kind="tertiary"
                  size="md"
                  renderIcon={Add}
                  onClick={() =>
                    openModal((props) => (
                      <UserToolModal project={project} {...props} />
                    ))
                  }
                  disabled={isProjectReadOnly}
                >
                  Create tool
                </Button>

                <ToolsList enableFetch={selectedTab === TabsIds.TOOLS} />
              </SettingsFormGroup>
            </TabPanel>
            <TabPanel>
              <SettingsFormGroup>
                <KnowledgeSelector />
              </SettingsFormGroup>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
}

export enum TabsIds {
  SETTINGS,
  TOOLS,
  KNOWLEDGE,
}
