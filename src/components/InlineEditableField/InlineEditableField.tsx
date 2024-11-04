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

import classes from './InlineEditableField.module.scss';
import { Checkmark, Close, Edit } from '@carbon/react/icons';
import {
  InputHTMLAttributes,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Button, TextInput } from '@carbon/react';
import { mergeRefs } from 'react-merge-refs';
import { RefCallBack } from 'react-hook-form';
import clsx from 'clsx';
import { CODE_ENTER, CODE_ESCAPE } from 'keycode-js';

interface Props
  extends Pick<
    InputHTMLAttributes<HTMLInputElement>,
    'name' | 'onChange' | 'placeholder' | 'maxLength'
  > {
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  refCallback?: RefCallBack;
  textClassName?: string;
  onConfirm?: (value: string) => void;
  value?: string;
  defaultValue?: string;
}

export function InlineEditableField({
  name,
  value: controlledValue,
  defaultValue,
  refCallback,
  invalid: invalidProp,
  required,
  disabled,
  textClassName,
  onChange,
  onConfirm,
  ...inputProps
}: Props) {
  const id = useId();
  const [isEditing, setEditing] = useState<boolean>(false);
  const [value, setValue] = useState(defaultValue ?? controlledValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const invalid = invalidProp || (required && !value);

  const ButtonIcon = !isEditing ? Edit : !invalid ? Checkmark : Close;

  return (
    <div
      className={clsx(classes.root, {
        [classes.isEditing]: isEditing,
        [classes.isInvalid]: invalid,
      })}
    >
      <div className={classes.input}>
        <TextInput
          type="text"
          labelText=""
          hideLabel
          name={name}
          value={controlledValue ?? value}
          id={`${id}:input`}
          onKeyDown={(e) => {
            if (!invalid && (e.code === CODE_ENTER || e.code === CODE_ESCAPE)) {
              setEditing(false);
              inputRef.current?.blur();

              if (e.code === CODE_ENTER)
                onConfirm?.(inputRef.current?.value ?? '');
              else {
                setValue(defaultValue);
              }
            }
          }}
          className={textClassName}
          disabled={disabled}
          onChange={(e) => {
            onChange?.(e);
            setValue(inputRef.current?.value ?? '');
          }}
          onBlur={(e) => {
            onChange?.(e);
            setEditing(false);
          }}
          ref={mergeRefs([refCallback, inputRef])}
          {...inputProps}
        />

        <span className={textClassName}>{value}</span>
      </div>

      {!disabled && (
        <Button
          className={classes.editButton}
          kind="ghost"
          size="sm"
          onClick={() => setEditing((isEditing) => !isEditing)}
        >
          <ButtonIcon size={16} />
        </Button>
      )}
    </div>
  );
}
