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

import clsx from 'clsx';
import { useController } from 'react-hook-form';
import {
  ASSISTANT_ICON_COLORS,
  AssistantBaseIcon,
  AssistantIconColor,
  AssitantIconName,
  getAssistantIcons,
} from '../icons/AssistantBaseIcon';
import {
  AssistantFormValues,
  useAssistantBuilder,
} from './AssistantBuilderProvider';
import classes from './AssistantIconSelector.module.scss';
import { IconSelectorBase } from './IconSelectorBase';

interface Props {
  disabled?: boolean;
}

export function AssistantIconSelector({ disabled }: Props) {
  const {
    assistant,
    formReturn: { watch },
  } = useAssistantBuilder();
  const assistantName = watch('ownName');

  const {
    field: { value, onChange },
  } = useController<AssistantFormValues, 'icon'>({ name: 'icon' });

  const { name, color } = value;

  const handleChange = ({
    name: newName,
    color: newColor,
  }: Partial<AssistantFormValues['icon']>) =>
    onChange({ name: newName ?? name, color: newColor ?? color });

  const BaseIcon = (name || assistant) && (
    <AssistantBaseIcon
      name={name}
      color={color}
      size="xl"
      initialLetter={assistantName?.at(0)}
      className={classes.icon}
    />
  );

  return (
    <IconSelectorBase baseIcon={BaseIcon} disabled={disabled} size="lg">
      <>
        <div className={classes.root}>
          {getAssistantIcons().map(([iconName, Icon]) => (
            <button
              key={iconName}
              className={clsx(classes.button, {
                [classes.selected]: iconName === name,
              })}
              onClick={() =>
                handleChange({ name: iconName as AssitantIconName })
              }
            >
              <Icon />
            </button>
          ))}
        </div>
        <div className={classes.root}>
          {ASSISTANT_ICON_COLORS.filter((color) => color !== 'black').map(
            (iconColor) => (
              <button
                key={iconColor}
                className={clsx(classes.button, {
                  [classes.selected]: iconColor === color,
                })}
                onClick={() => handleChange({ color: iconColor })}
              >
                <AssistantIconColor color={iconColor} />
              </button>
            ),
          )}
        </div>
      </>
    </IconSelectorBase>
  );
}
