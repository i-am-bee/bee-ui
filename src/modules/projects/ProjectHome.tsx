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
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { useUserProfile } from '@/store/user-profile';
import { Button, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { ReactElement, useState } from 'react';
import { ArchiveConfirmationModal } from './manage/ArchiveConfirmationModal';
import { RenameModal } from './manage/RenameModal';
import classes from './ProjectHome.module.scss';
import { UsersCount } from './users/UsersCount';
import { UsersModalRenderer } from './users/UsersModalRenderer';

interface Props {
  children: ReactElement;
}

export function ProjectHome({ children }: Props) {
  const [usersModalOpened, setUsersModalOpened] = useState(false);
  const { project, organization, isProjectReadOnly, role } = useAppContext();
  const { openModal } = useModal();
  const defaultProject = useUserProfile((state) => state.default_project);

  return (
    <>
      <AdminView
        header={
          <div className={classes.header}>
            <h1 className={classes.heading}>{project.name}</h1>
            <div className={classes.sharing}>
              {!isProjectReadOnly && (
                <>
                  <UsersCount project={project} organization={organization} />
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
                        <RenameModal
                          organization={organization}
                          project={project}
                          {...props}
                        />
                      ))
                    }
                  />
                  {project.id !== defaultProject && (
                    <OverflowMenuItem
                      itemText="Archive"
                      isDelete
                      onClick={() =>
                        openModal((props) => (
                          <ArchiveConfirmationModal
                            organization={organization}
                            {...props}
                            project={project}
                          />
                        ))
                      }
                    />
                  )}
                </OverflowMenu>
              )}
            </div>
          </div>
        }
      >
        {children}
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
