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

import { useSidebarCloseOnPathnameOnMobile } from '@/hooks/useSidebarCloseOnPathnameOnMobile';
import { AssistantsNav } from '@/modules/assistants/AssistantsNav';
import { ThreadsHistory } from '@/modules/chat/history/ThreadsHistory';
import { useLayout } from '@/store/layout';
import clsx from 'clsx';
import { UserSetting, useUserSetting } from '../hooks/useUserSetting';
import { CollapsibleGroup } from './CollapsibleGroup';
import { MainNav } from './MainNav';
import classes from './Sidebar.module.scss';
import { UserNav } from './UserNav';

export interface SidebarProps {
  id: string;
  isOpen: UserSetting['sidebarPinned'];
}

export function Sidebar({ id, isOpen }: SidebarProps) {
  const { setUserSetting } = useUserSetting();
  const sidebarVisible = useLayout((state) => !state.navbarProps?.backButton);

  useSidebarCloseOnPathnameOnMobile();

  return (
    <aside
      className={clsx(classes.root, {
        [classes.visible]: sidebarVisible,
        [classes.sidebarPinned]: isOpen,
      })}
    >
      <div
        className={classes.overlay}
        onClick={() => setUserSetting('sidebarPinned', false)}
      />

      <div id={id} aria-hidden={!isOpen} className={classes.panel}>
        <MainNav />

        <hr />

        <div className={classes.content}>
          <div className={classes.agents}>
            <AssistantsNav
              className={classes.scrollSection}
              enableFetch={Boolean(isOpen)}
            />
          </div>

          <hr />

          <CollapsibleGroup heading="Sessions" className={classes.history}>
            <ThreadsHistory
              enableFetch={Boolean(isOpen)}
              className={classes.scrollSection}
            />
          </CollapsibleGroup>
        </div>

        <hr />

        <UserNav className={classes.userNav} />
      </div>
    </aside>
  );
}
