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

import { Checkmark, Edit } from '@carbon/react/icons';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import { useController } from 'react-hook-form';
import { useOnClickOutside } from 'usehooks-ts';
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
import classes from './IconSelector.module.scss';

interface Props {
  disabled?: boolean;
}

export function IconSelector({ disabled }: Props) {
  const [opened, setOpened] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(selectorRef, () => {
    setOpened(false);
  });
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

  return disabled ? (
    <div className={classes.root}>{BaseIcon}</div>
  ) : (
    <div className={classes.root} ref={selectorRef}>
      <button
        className={classes.button}
        onClick={() => setOpened((opened) => !opened)}
      >
        {opened ? <Checkmark size={12} /> : <Edit size={12} />}
        {BaseIcon}
      </button>

      {/* TODO: animate */}
      {opened && (
        <div className={classes.selector}>
          <div className={classes.selectorContent}>
            <div>
              {getAssistantIcons().map(([iconName, Icon]) => (
                <button
                  key={iconName}
                  className={clsx({ [classes.selected]: iconName === name })}
                  onClick={() =>
                    handleChange({ name: iconName as AssitantIconName })
                  }
                >
                  <Icon />
                </button>
              ))}
              <div className={classes.colors}></div>
            </div>
            <div>
              {ASSISTANT_ICON_COLORS.filter((color) => color !== 'black').map(
                (iconColor) => (
                  <button
                    key={iconColor}
                    className={clsx(classes.color, {
                      [classes.selected]: iconColor === color,
                    })}
                    onClick={() => handleChange({ color: iconColor })}
                  >
                    <AssistantIconColor color={iconColor} />
                  </button>
                ),
              )}
              <div className={classes.colors}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
