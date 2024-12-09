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

import { IconSelectorBase } from '@/modules/assistants/builder/IconSelectorBase';
import clsx from 'clsx';
import { useController } from 'react-hook-form';
import {
  APP_ICONS_USER,
  AppIcon,
  AppIconName,
  AppIconUserName,
} from '../AppIcon';
import { AppFormValues } from '../manage/SaveAppModal';
import classes from './AppIconSelector.module.scss';

interface Props {
  disabled?: boolean;
}

export function AppIconSelector({ disabled }: Props) {
  const {
    field: { value: icon, onChange },
  } = useController<AppFormValues, 'icon'>({ name: 'icon' });

  const handleChange = (newIcon: AppFormValues['icon']) => {
    onChange(newIcon ?? icon);
  };

  const BaseIcon = <AppIcon name={icon} size="lg" className={classes.icon} />;

  return (
    <IconSelectorBase baseIcon={BaseIcon} disabled={disabled}>
      <div className={classes.root}>
        {Object.keys(APP_ICONS_USER).map((iconName) => {
          const Icon = APP_ICONS_USER[iconName as AppIconUserName];

          return (
            <button
              key={iconName}
              type="button"
              className={clsx(classes.button, {
                [classes.selected]: iconName === icon,
              })}
              onClick={() => handleChange(iconName as AppIconName)}
            >
              <Icon />
            </button>
          );
        })}
      </div>
    </IconSelectorBase>
  );
}
