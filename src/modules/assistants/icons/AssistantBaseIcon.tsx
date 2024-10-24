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

import { clsx } from 'clsx';
import has from 'lodash/has';
import { ReactElement } from 'react';
import classes from './AssistantBaseIcon.module.scss';

export interface AssistantBaseIconProps {
  name?: AssitantIconName;
  color?: AssistantIconColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialLetter?: string;
  className?: string;
}

export function AssistantBaseIcon({
  name: propName,
  color,
  initialLetter,
  size = 'md',
  className,
}: AssistantBaseIconProps) {
  const iconName = propName ?? (!initialLetter ? 'Bee' : null);
  const Icon =
    iconName && has(ASSISTANT_ICONS, iconName) && ASSISTANT_ICONS[iconName];

  return (
    <span
      className={clsx(classes.root, className, {
        [classes.noColor]: !color && Icon,
      })}
      data-size={size}
    >
      <AssistantIconColor color={color}>
        <>{Icon ? <Icon /> : initialLetter}</>
      </AssistantIconColor>
    </span>
  );
}

export function AssistantIconColor({
  color,
  children,
}: {
  color?: AssistantIconColor;
  children?: ReactElement;
}) {
  return (
    <span className={classes.color} data-color={color}>
      {children}
    </span>
  );
}

export function getAssistantIcons() {
  return Object.entries(ASSISTANT_ICONS).filter(
    ([iconName]) => iconName !== 'Bee' && iconName !== 'BeeOutline',
  );
}

export const ASSISTANT_ICONS = {
  Bee: require('./Bee.svg').default,
  BeeOutline: require('./BeeOutline.svg').default,
  BeeMain: require('./BeeMain.svg').default,
  BeeA: require('./BeeA.svg').default,
  BeeB: require('./BeeB.svg').default,
  BeeC: require('./BeeC.svg').default,
  BeeD: require('./BeeD.svg').default,
  BeeE: require('./BeeE.svg').default,
  BeeF: require('./BeeF.svg').default,
  BeeG: require('./BeeG.svg').default,
  BeeH: require('./BeeH.svg').default,
  BeeJ: require('./BeeJ.svg').default,
  BeeK: require('./BeeK.svg').default,
  BeeL: require('./BeeL.svg').default,
} as const;
export type AssitantIconName = keyof typeof ASSISTANT_ICONS;

export const ASSISTANT_ICON_COLORS = [
  'green-light',
  'green',
  'blue-light',
  'blue',
  'gray-light',
  'gray',
  'white',
  'black',
] as const;
export type AssistantIconColor = (typeof ASSISTANT_ICON_COLORS)[number];
