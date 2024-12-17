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

import { VersionTag } from '@/components/VersionTag/VersionTag';
import { usePrefetchThreads } from '@/modules/chat/history/usePrefetchThreads';
import { APP_NAME } from '@/utils/constants';
import { Button, ButtonBaseProps } from '@carbon/react';
import { Close, Menu } from '@carbon/react/icons';
import { MouseEvent } from 'react';
import { UserSetting } from '../hooks/useUserSetting';
import { SidebarProps } from './Sidebar';
import classes from './SidebarButton.module.scss';

interface Props extends Omit<ButtonBaseProps, 'kind' | 'size' | 'className'> {
  sidebarId: SidebarProps['id'];
  sidebarOpen: UserSetting['sidebarPinned'];
}

export function SidebarButton({
  sidebarId,
  sidebarOpen,
  onMouseEnter,
  ...props
}: Props) {
  const prefetchThreads = usePrefetchThreads();

  return (
    <div className={classes.root}>
      <Button
        {...props}
        onMouseEnter={(event: MouseEvent<HTMLButtonElement>) => {
          prefetchThreads();
          onMouseEnter?.(event);
        }}
        kind="ghost"
        size="sm"
        aria-expanded={sidebarOpen}
        aria-controls={sidebarId}
        aria-label="Toggle sidebar"
      >
        <Menu />

        <Close />
      </Button>

      <p className={classes.title}>{APP_NAME}</p>

      <VersionTag />
    </div>
  );
}
