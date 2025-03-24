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
  MessageFeedback,
  MessageFeedbackCategory,
} from '@/app/api/threads-messages/types';
import { useToast } from '@/layout/providers/ToastProvider';
import { Button, IconButton, Tag, TextArea, usePrefix } from '@carbon/react';
import { Close } from '@carbon/react/icons';
import clsx from 'clsx';
import {
  MouseEventHandler,
  PropsWithChildren,
  useCallback,
  useId,
  useMemo,
} from 'react';
import { ControllerProps, useController } from 'react-hook-form';
import { useMessageFeedback } from '../../providers/MessageFeedbackProvider';
import classes from './MessageFeedbackForm.module.scss';

export function MessageFeedbackForm() {
  const id = useId();
  const { addToast } = useToast();

  const {
    form,
    closeForm,
    onSubmit,
    formState: { isSubmitting },
  } = useMessageFeedback();

  const handleSubmit = form.handleSubmit(
    async ({ vote, categories, comment }) => {
      await onSubmit({ vote, categories, comment }, () => closeForm());
    },
    (errors) => {
      const errorMessages = Object.values(errors).map(({ message }) => message);
      addToast({
        title: 'Form contains errors',
        subtitle: errorMessages.join('\n'),
      });
    },
  );

  return (
    <>
      <header className={classes.header}>
        <IconButton
          kind="ghost"
          wrapperClasses={classes.closeButton}
          label="Close"
          onClick={() => closeForm()}
          size="sm"
        >
          <Close />
        </IconButton>

        <h3 className={classes.heading}>What went wrong?</h3>
      </header>

      <form onSubmit={handleSubmit}>
        <ul className={classes.list}>
          {CATEGORIES.map(({ id, label }) => {
            return (
              <Item
                key={id}
                value={id}
                controllerProps={{
                  control: form.control,
                  name: 'categories',
                  disabled: isSubmitting,
                }}
              >
                {label}
              </Item>
            );
          })}
        </ul>

        <TextArea
          className={classes.comment}
          id={`${id}:comment`}
          labelText="Comments (optional)"
          placeholder="Add more details on what went wrong and how the answer could be improved"
          rows={4}
          autoFocus
          {...form.register('comment', {
            maxLength: {
              value: COMMENT_MAX_LENGTH,
              message: `Comments field can have maximum length of ${COMMENT_MAX_LENGTH} characters`,
            },
          })}
        />

        <div className={classes.submit}>
          <Button
            type="submit"
            size="md"
            kind="secondary"
            disabled={isSubmitting}
          >
            Submit
          </Button>
        </div>
      </form>
    </>
  );
}

function Item({
  value,
  controllerProps,
  children,
}: PropsWithChildren<{
  value: MessageFeedbackCategory;
  controllerProps: Omit<
    ControllerProps<MessageFeedback, 'categories'>,
    'render'
  >;
}>) {
  const carbonPrefix = usePrefix();
  const { field } = useController({
    control: controllerProps.control,
    name: controllerProps.name,
    disabled: controllerProps.disabled,
  });

  const prevValue = useMemo(() => field.value || [], [field.value]);
  const isSelected = prevValue.includes(value);

  const handleChange = useCallback(
    (value: string, checked: boolean) => {
      const newValue = checked
        ? [...prevValue, value]
        : prevValue.filter((selectedValue: string) => selectedValue !== value);

      field.onChange(newValue);
    },
    [field, prevValue],
  );

  const handleTagClick: MouseEventHandler = (event) => {
    event.preventDefault();

    handleChange(value, !isSelected);
  };

  return (
    <li>
      <Tag
        // *--tag--operational class is used as temporary bugfix for properly styling Carbon Tag component
        className={clsx(`${carbonPrefix}--tag--operational`, classes.tag, {
          [classes.toggled]: isSelected,
        })}
        onClick={handleTagClick}
        disabled={controllerProps.disabled}
      >
        {children}
      </Tag>
    </li>
  );
}

const CATEGORIES: {
  id: MessageFeedbackCategory;
  label: string;
}[] = [
  {
    id: 'accuracy',
    label: 'Accuracy',
  },
  {
    id: 'comprehensiveness',
    label: 'Comprehensiveness',
  },
  {
    id: 'information_retrieval',
    label: 'Information retrieval',
  },
  {
    id: 'sophistication',
    label: 'Sophistication',
  },
  {
    id: 'latency',
    label: 'Latency',
  },
  {
    id: 'other_content',
    label: 'Other',
  },
];

// This is approx. minimum remaining length of the metadata prop available
// after subtracting possible other props and chars of the stringified
// feedback object. We might consider moving the comment into a separate
// props to make use of full 512 chars limit on the metadata prop
export const COMMENT_MAX_LENGTH = 255;
