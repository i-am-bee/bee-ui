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

import { useAppContext } from '@/layout/providers/AppProvider';
import { TextInput } from '@carbon/react';
import clsx from 'clsx';
import { memo, useId } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import classes from './AssistantBaseInfo.module.scss';
import { AssistantFormValues } from './AssistantBuilderProvider';
import { IconSelector } from './IconSelector';

export const AssistantBaseInfo = memo(function AssistantBaseInfo() {
  const { isProjectReadOnly } = useAppContext();

  return (
    <div className={classes.root}>
      <IconSelector disabled={isProjectReadOnly} />
      <Input
        name="ownName"
        placeholder="Name your bee"
        className={classes.title}
        maxLength={55}
        primaryFocus
        required
      />
      <Input
        name="description"
        placeholder="Describe your bee"
        maxLength={100}
      />
      {/* TODO: author */}
      {/* <div className={classes.name}></div> */}
    </div>
  );
});

interface InputProps {
  name: 'ownName' | 'description';
  placeholder: string;
  className?: string;
  maxLength?: number;
  primaryFocus?: boolean;
  required?: boolean;
}

const Input = ({
  name,
  placeholder,
  className,
  maxLength,
  primaryFocus,
  required,
}: InputProps) => {
  const htmlId = useId();
  const {
    formState: { isSubmitting },
  } = useFormContext<AssistantFormValues>();
  const { isProjectReadOnly } = useAppContext();

  const {
    field: { value, ref, onChange },
    fieldState: { invalid },
  } = useController({
    name,
    rules: {
      required,
      maxLength,
    },
  });

  return (
    <TextInput
      id={htmlId}
      name={name}
      labelText=""
      placeholder={placeholder}
      value={value}
      ref={ref}
      onChange={onChange}
      disabled={isSubmitting}
      readOnly={isProjectReadOnly}
      className={clsx(classes.input, className)}
      maxLength={maxLength}
      data-modal-primary-focus={primaryFocus}
    />
  );
};
