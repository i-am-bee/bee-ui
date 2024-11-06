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

'use client';
import clsx from 'clsx';
import { useAssistantBuilder } from './AssistantBuilderProvider';
import classes from './Builder.module.scss';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteAssistant } from './useDeleteAssistant';
import { useAppContext } from '@/layout/providers/AppProvider';
import { Button, IconButton, TextArea, TextInput } from '@carbon/react';
import { ArrowLeft, CheckmarkFilled } from '@carbon/react/icons';
import { IconSelector } from './IconSelector';
import { useId } from 'react';
import { InstructionsTextArea } from './InstructionsTextArea';
import { StarterQuestionsTextArea } from './StarterQuestionsTextArea';
import { BuilderTools } from '../tools/BuilderTools';
import { KnowledgeSelector } from './KnowledgeSelector';

export function Builder() {
  const {
    assistant,
    formReturn: {
      register,
      formState: { isSubmitting, isDirty },
    },
  } = useAssistantBuilder();
  const { project, isProjectReadOnly } = useAppContext();
  const queryClient = useQueryClient();
  const id = useId();

  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant: assistant!,
  });

  const isSaved = Boolean(assistant && !isDirty);

  return (
    <div
      className={clsx(classes.root, {
        [classes.isDeletePending]: isDeletePending,
      })}
    >
      <section className={classes.form}>
        <div className={classes.header}>
          <IconButton size="lg" kind="tertiary" label="Back to home">
            <ArrowLeft />
          </IconButton>
          <h1>{assistant?.name ?? 'New bee'}</h1>
        </div>

        <fieldset disabled={isProjectReadOnly}>
          <IconSelector disabled={isProjectReadOnly} />
          <TextInput
            id={`${id}:name`}
            placeholder="Name your bee"
            maxLength={NAME_MAX_LENGTH}
            labelText="Name"
            {...register('ownName', { required: true })}
          />
          <TextArea
            labelText="Description (user-facing)"
            rows={3}
            placeholder="Describe your bee so users can kow how to use it"
            {...register('description', { required: true })}
          />
          <InstructionsTextArea />
          <StarterQuestionsTextArea />
          <BuilderTools />
          <KnowledgeSelector />
        </fieldset>

        <div className={classes.actionBar}>
          {assistant && (
            <Button kind="danger--ghost" onClick={deleteAssistant}>
              Delete bee
            </Button>
          )}

          <Button
            kind="secondary"
            onClick={() => {}}
            renderIcon={isSaved ? CheckmarkFilled : undefined}
            disabled={isProjectReadOnly || isSaved}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </section>
      <section className={classes.chat}></section>
    </div>
  );
}

const NAME_MAX_LENGTH = 55;
