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

import { ExpandPanel } from '@/components/ExpandPanel/ExpandPanel';
import { ExpandPanelButton } from '@/components/ExpandPanelButton/ExpandPanelButton';
import clsx from 'clsx';
import { PropsWithChildren, ReactNode, useId, useState } from 'react';
import classes from './CollapsibleGroup.module.scss';

interface Props {
  heading: ReactNode;
  className?: string;
}

export function CollapsibleGroup({
  heading,
  className,
  children,
}: PropsWithChildren<Props>) {
  const id = useId();
  const triggerId = `${id}:trigger`;
  const panelId = `${id}:panel`;

  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={clsx(classes.root, className)}
      aria-expanded={expanded ? 'true' : 'false'}
    >
      <header className={classes.header}>
        <h3 className={classes.heading}>{heading}</h3>

        <ExpandPanelButton
          id={triggerId}
          panelId={panelId}
          expanded={expanded}
          onClick={() => {
            setExpanded((state) => !state);
          }}
        />
      </header>

      <ExpandPanel
        id={panelId}
        triggerId={triggerId}
        expanded={expanded}
        onFocus={() => {
          setExpanded(true);
        }}
        className={classes.panel}
      >
        <div className={classes.content}>{children}</div>
      </ExpandPanel>
    </div>
  );
}
