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
import { RunMetadata } from '@/app/api/threads-runs/types';
import { Thread } from '@/app/api/threads/types';
import { ToolReference } from '@/app/api/tools/types';
import { Link } from '@/components/Link/Link';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ChatHomeView } from '@/modules/chat/ChatHomeView';
import { ChatProvider, useChat } from '@/modules/chat/providers/ChatProvider';
import { FilesUploadProvider } from '@/modules/chat/providers/FilesUploadProvider';
import { MessageWithFiles } from '@/modules/chat/types';
import { VectorStoreFilesUploadProvider } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { ONBOARDING_PARAM } from '@/utils/constants';
import {
  Button,
  IconButton,
  InlineLoading,
  TextArea,
  TextInput,
} from '@carbon/react';
import { ArrowLeft, CheckmarkFilled } from '@carbon/react/icons';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useRouter } from 'next-nprogress-bar';
import { useId } from 'react';
import { Controller } from 'react-hook-form';
import { BuilderTools } from '../tools/BuilderTools';
import {
  AssistantFormValues,
  useAssistantBuilder,
  useAssistantBuilderApi,
} from './AssistantBuilderProvider';
import classes from './Builder.module.scss';
import { IconSelector } from './IconSelector';
import { InstructionsTextArea } from './InstructionsTextArea';
import { KnowledgeSelector } from './KnowledgeSelector';
import { StarterQuestionsTextArea } from './StarterQuestionsTextArea';
import { useDeleteAssistant } from './useDeleteAssistant';

interface Props {
  thread?: Thread;
  initialMessages?: MessageWithFiles[];
}

export function Builder({ thread, initialMessages }: Props) {
  const {
    assistant,
    formReturn: {
      watch,
      formState: { isSubmitting, dirtyFields },
    },
    isOnboarding,
  } = useAssistantBuilder();
  const { project, isProjectReadOnly } = useAppContext();
  const { onSubmit } = useAssistantBuilderApi();
  const id = useId();
  const router = useRouter();

  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant: assistant!,
    onSuccess: () => {
      router.push(`/${project.id}`);
    },
  });

  const isSaved = Boolean(assistant && isEmpty(dirtyFields));

  const handleAutoSaveAssistant = () => {
    !isSaved && onSubmit();
  };

  const assitantName = watch('ownName');
  const assitantDescription = watch('description');
  const assitantIcon = watch('icon');

  return (
    <div
      className={clsx(classes.root, {
        [classes.isDeletePending]: isDeletePending,
      })}
    >
      <section className={classes.form}>
        <div className={classes.header}>
          <Link
            href={`/${project.id}${isOnboarding ? `?${ONBOARDING_PARAM}` : ''}`}
          >
            <IconButton
              size="lg"
              kind="tertiary"
              label="Back to home"
              align="bottom-left"
            >
              <ArrowLeft />
            </IconButton>
          </Link>
          <h1>{assitantName ?? 'New bee'}</h1>
        </div>

        <fieldset disabled={isProjectReadOnly}>
          <IconSelector disabled={isProjectReadOnly} />
          <Controller
            name="ownName"
            rules={{ required: true }}
            render={({
              field: { onChange, value, ref },
              fieldState: { invalid },
            }) => (
              <TextInput
                id={`${id}:name`}
                placeholder="Name your bee"
                maxLength={NAME_MAX_LENGTH}
                labelText="Name"
                size="lg"
                onChange={onChange}
                invalid={invalid}
                invalidText="Name is required"
                value={value}
                ref={ref}
              />
            )}
          />

          <Controller
            name="description"
            render={({ field: { onChange, value, ref } }) => (
              <TextArea
                labelText="Description (user-facing)"
                rows={3}
                placeholder="Describe your bee so users can kow how to use it"
                invalidText="Description is required"
                value={value}
                ref={ref}
                onChange={onChange}
              />
            )}
          />

          <InstructionsTextArea />
          <StarterQuestionsTextArea />
          <BuilderTools />
          <KnowledgeSelector />
        </fieldset>

        <div className={classes.actionBar}>
          <div>
            {assistant && (
              <Button
                kind="danger--ghost"
                onClick={deleteAssistant}
                disabled={isProjectReadOnly || isDeletePending}
              >
                {isDeletePending ? (
                  <InlineLoading title="Deleting..." />
                ) : (
                  'Delete bee'
                )}
              </Button>
            )}
          </div>

          <div>
            <Button
              kind="secondary"
              onClick={() => onSubmit()}
              renderIcon={isSaved ? CheckmarkFilled : undefined}
              disabled={isProjectReadOnly || isSaved || isSubmitting}
            >
              {isSubmitting ? (
                <InlineLoading description="Saving..." />
              ) : isSaved ? (
                'Saved'
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </section>
      <section className={classes.chat}>
        <VectorStoreFilesUploadProvider projectId={project.id}>
          <FilesUploadProvider>
            <ChatProvider
              threadAssistant={{
                data: assistant,
              }}
              thread={thread}
              initialData={initialMessages}
              builderState={{
                isSaved,
                onAutoSaveAssistant: handleAutoSaveAssistant,
                name: assitantName,
                description: assitantDescription,
                icon: assitantIcon,
              }}
            >
              <BuilderChat />
            </ChatProvider>
          </FilesUploadProvider>
        </VectorStoreFilesUploadProvider>
      </section>
    </div>
  );
}

const NAME_MAX_LENGTH = 55;

function BuilderChat() {
  const { thread, assistant, reset, getMessages } = useChat();
  const { project } = useAppContext();

  const handleClear = () => {
    reset([]);

    if (thread)
      window.history.replaceState(
        undefined,
        '',
        `/${project.id}/builder/${assistant.data?.id}`,
      );
  };

  return (
    <>
      <div className={classes.chatTopBar}>
        <div>This is preview of your bee. </div>

        <Button
          kind="ghost"
          size="md"
          disabled={!thread}
          className={classes.newSessionButton}
          onClick={handleClear}
        >
          Clear chat
        </Button>
      </div>
      <ChatHomeView />
    </>
  );
}

export interface AssistantBuilderState {
  isSaved: boolean;
  name: string;
  description?: string;
  icon?: AssistantFormValues['icon'];
  onAutoSaveAssistant: () => void;
}

export interface RunSetup {
  instructions: string | null;
  tools: ToolReference[];
  resources: RunMetadata['resources'];
}
