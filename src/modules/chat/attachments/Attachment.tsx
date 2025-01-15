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

import { Button } from '@carbon/react';
import { CarbonIconProps, Close, Document } from '@carbon/react/icons';
import { clsx } from 'clsx';
import { ComponentType, MouseEventHandler, PropsWithChildren } from 'react';
import classes from './Attachment.module.scss';
import { Tooltip } from '@/components/Tooltip/Tooltip';

export interface AttachmentProps {
  size?: 'md';
  startIcon?: ComponentType | null;
  endIcon?: ComponentType | null;
  onRemoveClick?: MouseEventHandler;
  className?: string;
  description?: string;
}

export function Attachment({
  size,
  startIcon: StartIcon = Document,
  endIcon: EndIcon,
  className,
  description,
  onRemoveClick,
  children,
}: PropsWithChildren<AttachmentProps>) {
  const elem = (
    <span
      className={clsx(classes.root, className, {
        [classes[`size-${size}`]]: size,
      })}
    >
      {StartIcon && (
        <span className={classes.icon}>
          <StartIcon />
        </span>
      )}

      <span className={classes.label}>{children}</span>

      {EndIcon && (
        <span className={classes.icon}>
          <EndIcon />
        </span>
      )}

      {onRemoveClick && (
        <span className={classes.removeButton}>
          <Button
            iconDescription="Remove"
            kind="danger--tertiary"
            onClick={onRemoveClick}
            hasIconOnly
          >
            <Close />
          </Button>
        </span>
      )}
    </span>
  );

  if (description)
    return (
      <Tooltip placement="top" content={description} asChild>
        {elem}
      </Tooltip>
    );

  return elem;
}
