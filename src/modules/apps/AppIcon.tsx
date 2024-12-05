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

import {
  Book,
  Bot,
  ChartLineSmooth,
  Chat,
  Chemistry,
  Code,
  ColorPalette,
  CurrencyDollar,
  EarthFilled,
  FaceWink,
  Favorite,
  Gamification,
  GroupPresentation,
  Idea,
  Lightning,
  Pen,
  Rocket,
  TextShortParagraph,
  ToolKit,
  UserMultiple,
} from '@carbon/react/icons';
import { clsx } from 'clsx';
import has from 'lodash/has';
import classes from './AppIcon.module.scss';

interface Props {
  name?: AppIconName;
  size?: 'md' | 'lg';
  className?: string;
}

export function AppIcon({ name: propName, className, size = 'md' }: Props) {
  const iconName = propName ?? 'TextShortParagraph';
  const Icon = iconName && has(APP_ICONS, iconName) && APP_ICONS[iconName];

  return (
    <span className={clsx(classes.root, className)} data-size={size}>
      {Icon ? <Icon /> : <TextShortParagraph />}
    </span>
  );
}

export const APP_ICONS = {
  ColorPalette,
  Pen,
  FaceWink,
  Idea,
  Book,
  Chat,
  Chemistry,
  ToolKit,
  UserMultiple,
  CurrencyDollar,
  Rocket,
  TextShortParagraph,
  Code,
  Bot,
  Favorite,
  EarthFilled,
  GroupPresentation,
  Lightning,
  Gamification,
  ChartLineSmooth,
};

export type AppIconName = keyof typeof APP_ICONS;
