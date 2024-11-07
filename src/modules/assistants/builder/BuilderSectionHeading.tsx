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
import { ComponentProps, ComponentType, ReactElement } from 'react';
import classes from './BuilderSectionHeading.module.scss';
import { Add } from '@carbon/react/icons';

interface Props {
  title: string;
  buttonProps?: ComponentProps<typeof Button>;
}
export function BuilderSectionHeading({ title, buttonProps }: Props) {
  return (
    <div className={classes.root}>
      <h2>{title}</h2>
      <Button kind="ghost" size="md" renderIcon={Add} {...buttonProps} />
    </div>
  );
}
