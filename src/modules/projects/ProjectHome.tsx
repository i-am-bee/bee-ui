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
import { ReactElement, useState } from 'react';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useQueryClient } from '@tanstack/react-query';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import {
  Button,
  OverflowMenu,
  OverflowMenuItem,
  Tab,
  TabList,
  Tabs,
} from '@carbon/react';
import { prelistVectorStores } from '../knowledge/queries';
import { ProjectSelector } from './ProjectSelector';
import classes from './ProjectHome.module.scss';
import { useRouter } from 'next-nprogress-bar';
import { UsersCount } from './users/UsersCount';
import { Add } from '@carbon/react/icons';
import { useModal } from '@/layout/providers/ModalProvider';
import { RenameModal } from './manage/RenameModal';
import { UsersModalRenderer } from './users/UsersModalRenderer';
import { ArchiveConfirmationModal } from './manage/ArchiveConfirmationModal';
import { prelistDefaultData } from '../tools/ToolsList';

interface Props {
  section: HomeSection;
  children: ReactElement;
}

export function ProjectHome({ section, children }: Props) {
  const [usersModalOpened, setUsersModalOpened] = useState(false);
  const { project, isProjectReadOnly, role } = useAppContext();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { openModal } = useModal();

  return (
    <>
      <AdminView
        header={
          <div className={classes.header}>
            <h1 className={classes.heading}>
              Home
              <ProjectSelector hideReadOnlyTag />
            </h1>
            <div className={classes.sharing}>
              {!isProjectReadOnly && (
                <>
                  <UsersCount project={project} />
                  <Button
                    renderIcon={Add}
                    kind="tertiary"
                    size="md"
                    onClick={() => setUsersModalOpened(true)}
                  >
                    Share
                  </Button>
                </>
              )}
              {role === 'admin' && (
                <OverflowMenu size="md">
                  <OverflowMenuItem
                    itemText="Rename"
                    onClick={() =>
                      openModal((props) => (
                        <RenameModal project={project} {...props} />
                      ))
                    }
                  />
                  <OverflowMenuItem
                    itemText="Archive"
                    isDelete
                    onClick={() =>
                      openModal((props) => (
                        <ArchiveConfirmationModal
                          {...props}
                          project={project}
                        />
                      ))
                    }
                  />
                </OverflowMenu>
              )}
            </div>
          </div>
        }
      >
        <div className={classes.root}>
          <Tabs selectedIndex={TABS.findIndex(({ id }) => id === section)}>
            <TabList aria-label="Project sections">
              {TABS.filter(
                ({ featureName }) =>
                  !featureName || isFeatureEnabled(featureName),
              ).map(({ id, url, title, onPrelistData }) => (
                <Tab
                  key={id}
                  onClick={() => router.push(`/${project.id}${url}`)}
                  onMouseEnter={() => onPrelistData?.(project.id, queryClient)}
                >
                  {title}
                </Tab>
              ))}
            </TabList>
          </Tabs>

          {children}
        </div>
      </AdminView>
      <UsersModalRenderer
        isOpened={usersModalOpened}
        onModalClose={() => setUsersModalOpened(false)}
      />
    </>
  );
}

export enum HomeSection {
  Bees = 'Bees',
  Tools = 'Tools',
  Knowledge = 'Knowledge',
}

const TABS = [
  {
    id: HomeSection.Bees,
    title: 'Bees',
    url: '/',
  },
  {
    id: HomeSection.Tools,
    title: 'Tools',
    url: '/tools',
    onPrelistData: prelistDefaultData,
  },
  {
    id: HomeSection.Knowledge,
    title: 'Knowledge',
    url: '/knowledge',
    featureName: FeatureName.Knowledge,
    onPrelistData: prelistVectorStores,
  },
];
