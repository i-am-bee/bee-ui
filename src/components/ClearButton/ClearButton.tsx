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

import { IconButton } from '@carbon/react';
import { Close } from '@carbon/react/icons';
import { ComponentProps, HTMLProps } from 'react';
import classes from './ClearButton.module.scss';
import clsx from 'clsx';

interface Props extends Partial<ComponentProps<typeof IconButton>> {}

export function ClearButton({ className, ...props }: Props) {
  return (
    <IconButton
      kind="ghost"
      wrapperClasses={clsx(classes.button, className)}
      size="sm"
      label="Clear"
      autoAlign
      {...props}
    >
      <Close />
    </IconButton>
  );
}
