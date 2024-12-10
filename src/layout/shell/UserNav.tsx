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

import { ExternalLink } from '@/components/ExternalLink/ExternalLink';
import { Link } from '@/components/Link/Link';
import { DOCUMENTATION_URL } from '@/utils/constants';
import { ArrowUpRight } from '@carbon/react/icons';
import clsx from 'clsx';
import { HTMLAttributes } from 'react';
import { useAppContext } from '../providers/AppProvider';
import classes from './UserNav.module.scss';
import { UserProfile } from './UserProfile';

interface Props extends HTMLAttributes<HTMLElement> {}

export function UserNav({ className }: Props) {
  const { project } = useAppContext();

  return (
    <nav className={clsx(classes.root, className)} aria-label="User menu">
      <ul className={classes.nav}>
        <li>
          <Link href={`/${project.id}/tools/public`}>Public tools</Link>
        </li>
        {DOCUMENTATION_URL && (
          <li>
            <ExternalLink href={DOCUMENTATION_URL} Icon={ArrowUpRight}>
              Resources
            </ExternalLink>
          </li>
        )}
      </ul>

      <UserProfile />
    </nav>
  );
}
