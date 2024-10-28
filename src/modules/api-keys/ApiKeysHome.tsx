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
import { AdminView } from '@/components/AdminView/AdminView';
import { HomeSection, ProjectHome } from '../projects/ProjectHome';
import classes from './ApiKeysHome.module.scss';
import { Tab, TabList, Tabs } from '@carbon/react';
import { useRouter } from 'next-nprogress-bar';
import { useAppContext } from '@/layout/providers/AppProvider';

export function ApiKeysHome() {
  const router = useRouter();
  const section = PreferencesSection.ApiKeys;
  const { project } = useAppContext();

  return (
    <AdminView title="User Preferences">
      <div className={classes.root}>
        <Tabs selectedIndex={TABS.findIndex(({ id }) => id === section)}>
          <TabList aria-label="Project sections">
            {TABS.map(({ id, url, title }) => (
              <Tab key={id} onClick={() => router.push(`/${project.id}${url}`)}>
                {title}
              </Tab>
            ))}
          </TabList>
        </Tabs>

        <p>
          Your API key is sensitive information and should not be shared with
          anyone. Keep it secure to prevent unauthorized access to your account.
        </p>
      </div>
    </AdminView>
  );
}

export enum PreferencesSection {
  ApiKeys = 'ApiKeys',
}

const TABS = [
  {
    id: PreferencesSection.ApiKeys,
    title: 'API keys',
    url: '/api-keys',
  },
];
