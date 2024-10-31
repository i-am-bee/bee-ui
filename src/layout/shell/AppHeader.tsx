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
import { prefetchThreads } from '@/modules/chat/history/queries';
import { ThreadsHistory } from '@/modules/chat/history/ThreadsHistory';
import { ProjectSelector } from '@/modules/projects/ProjectSelector';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { useUserSetting } from '../hooks/useUserSetting';
import { useAppContext } from '../providers/AppProvider';
import { ActionButton } from './ActionButton';
import classes from './AppHeader.module.scss';
import { CollapsibleGroup } from './CollapsibleGroup';
import { NavButton } from './NavButton';
import Pinned from './Pinned.svg';
import { RecentAssistantsList } from './RecentAssistantsList';
import Unpinned from './Unpinned.svg';
import { UserNav } from './UserNav';

export function AppHeader() {
  const id = useId();
  const menuId = `${id}:menu`;
  const ref = useRef<HTMLElement>(null);
  const { getUserSetting, setUserSetting } = useUserSetting();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarPinned = getUserSetting('sidebarPinned');
  const { project } = useAppContext();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (sidebarPinned) {
      setSidebarOpen(true);
    }
  }, [sidebarPinned]);

  return (
    <header
      className={clsx(classes.root, {
        [classes.sidebarOpen]: sidebarOpen,
        [classes.sidebarPinned]: sidebarPinned,
      })}
      ref={ref}
      onMouseEnter={() => {
        setSidebarOpen(true);
        prefetchThreads(project.id, queryClient);
      }}
      onMouseLeave={() => {
        if (!sidebarPinned) {
          setSidebarOpen(false);
        }
      }}
    >
      <SkipToContent />

      <div className={classes.hoverArea} />

      <div className={classes.topHolder}>
        <div className={classes.top}>
          <NavButton isOpen={sidebarOpen} />

          <div className={classes.pinButton}>
            <ActionButton
              iconDescription={
                sidebarPinned ? 'Unpin the sidebar' : 'Pin the sidebar'
              }
              onClick={() => {
                setUserSetting('sidebarPinned', !sidebarPinned);
              }}
            >
              {sidebarPinned ? <Pinned /> : <Unpinned />}
            </ActionButton>
          </div>
        </div>
      </div>

      <div className={classes.sidebarHolder}>
        <div id={menuId} aria-hidden={!sidebarOpen} className={classes.sidebar}>
          <div className={classes.menu}>
            <div className={classes.main}>
              {/* TODO: Implement search */}
              {/* <ThreadsHeader /> */}

              <div className={classes.projectSelector}>
                <ProjectSelector />
              </div>

              <CollapsibleGroup heading="Recent bees">
                <RecentAssistantsList enableFetch={sidebarOpen} />
              </CollapsibleGroup>

              <CollapsibleGroup heading="Sessions" shrink>
                <ThreadsHistory
                  enableFetch={sidebarOpen}
                  className={classes.history}
                />
              </CollapsibleGroup>
            </div>

            <UserNav className={classes.userNav} />
          </div>
        </div>
      </div>
    </header>
  );
}

function SkipToContent() {
  return (
    <a className={classes.skipToContent} href="#main-content" tabIndex={0}>
      Skip to main content
    </a>
  );
}
