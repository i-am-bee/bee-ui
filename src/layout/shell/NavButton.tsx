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

import { Link } from '@/components/Link/Link';
import { Button, ButtonBaseProps } from '@carbon/react';
import clsx from 'clsx';
import BeeOutline from './BeeOutline.svg';
import classes from './NavButton.module.scss';
import { VersionTag } from '@/components/VersionTag/VersionTag';
import { useAppContext } from '../providers/AppProvider';

interface Props extends Omit<ButtonBaseProps, 'kind'> {
  isOpen?: boolean;
}

export function NavButton({ isOpen, ...props }: Props) {
  const { project } = useAppContext();
  return (
    <Link
      href={`/${project.id}`}
      className={clsx(classes.root, { [classes.isOpen]: isOpen })}
      tabIndex={-1}
    >
      <Button {...props} kind="ghost">
        <BeeOutline className={classes.icon} />

        <strong>Bee</strong>

        <VersionTag className={classes.tag} />
      </Button>
    </Link>
  );
}
