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
import { Thread, ThreadMetadata } from '@/app/api/threads/types';
import { encodeMetadata } from '@/app/api/utils';
import { Link } from '@/components/Link/Link';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAppContext } from '@/layout/providers/AppProvider';
import { getNewSessionUrl } from '@/layout/shell/NewSessionButton';
import {
  Button,
  ButtonBaseProps,
  OverflowMenu,
  OverflowMenuItem,
  SkeletonText,
  TextInput,
} from '@carbon/react';
import { WarningFilled } from '@carbon/react/icons';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { CODE_ENTER, CODE_ESCAPE } from 'keycode-js';
import truncate from 'lodash/truncate';
import { useRouter } from 'next-nprogress-bar';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useThreadsQueries } from '../api';
import { useDeleteThread } from '../api/mutations/useDeleteThread';
import { useUpdateThread } from '../api/mutations/useUpdateThread';
import {
  getThreadAssistantName,
  useGetThreadAssistant,
} from '../hooks/useGetThreadAssistant';
import { useThreadFileCount } from '../hooks/useThreadFileCount';
import { FileCount } from './FileCount';
import classes from './ThreadItem.module.scss';

interface Props {
  thread: Thread;
}

interface FormValues {
  title?: string;
}

export function ThreadItem({ thread }: Props) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { project } = useAppContext();
  const id = useId();
  const assistant = useGetThreadAssistant(thread);
  const { title } = thread.uiMetadata;
  const fileCount = useThreadFileCount(thread);
  const threadsQueries = useThreadsQueries();

  const isMdDown = useBreakpoint('mdDown');

  const href =
    assistant.data?.agent === 'streamlit'
      ? `/${project.id}/apps/builder/t/${thread.id}`
      : `/${project.id}/thread/${thread.id}`;
  const isActive = pathname === href;

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: truncate(title, { length: THREAD_TITLE_MAX_LENGTH }) || '',
    },
    mode: 'onBlur',
  });

  // Fallback for when the message is not saved in thread metadata
  const { data, isLoading, error, refetch } = useQuery({
    ...threadsQueries.messagesList(thread.id, { limit: 1 }),
    enabled: !title,
  });

  const {
    mutateWithConfirmationAsync: deleteThread,
    isPending: isDeletePending,
  } = useDeleteThread({
    onMutate: () => {
      if (isActive) {
        router.push(getNewSessionUrl(project.id, assistant.data));
      }
    },
  });

  const { mutateAsync: updateThread } = useUpdateThread();

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (values) => {
      setIsEditing(false);

      if (!values.title || values.title === title) {
        reset({ title });

        return;
      }

      await updateThread({
        id: thread.id,
        body: {
          metadata: encodeMetadata<ThreadMetadata>({
            ...thread.uiMetadata,
            title: values.title,
          }),
        },
      });
    },
    [title, updateThread, thread, reset],
  );

  const heading =
    title ??
    data?.data
      .at(-1)
      ?.content.map(({ text }) => text.value)
      .join('');

  useEffect(() => {
    if (isEditing) {
      setFocus('title');
    }
  }, [isEditing, setFocus]);

  return isLoading ? (
    <ThreadItem.Skeleton />
  ) : heading ? (
    <li
      className={clsx(classes.root, {
        [classes.error]: error,
        [classes.focusWithin]: optionsOpen,
        [classes.isDeletePending]: isDeletePending,
      })}
    >
      <div className={classes.wrapper}>
        <p className={classes.header}>
          {error && <WarningFilled />}

          <Link
            href={href}
            prefetch={false}
            className={clsx(classes.link, {
              [classes.active]: isActive,
            })}
          >
            <span className={classes.heading}>
              <span className={classes.truncate}>
                {!error ? heading : 'Failed to load'}
              </span>

              {fileCount > 0 && (
                <FileCount count={fileCount} className={classes.fileCount} />
              )}
            </span>
            <span className={clsx(classes.subheading, classes.truncate)}>
              {getThreadAssistantName(assistant)}
            </span>
          </Link>
        </p>

        <div className={classes.options}>
          <OverflowMenu
            aria-label="Options"
            align="left"
            size="sm"
            onOpen={() => setOptionsOpen(true)}
            onClose={() => setOptionsOpen(false)}
            flipped={isMdDown}
          >
            <OverflowMenuItem
              disabled={!isValid || isSubmitting}
              itemText="Rename"
              onClick={() => setIsEditing(true)}
            />
            <OverflowMenuItem
              isDelete
              itemText="Delete"
              onClick={() => deleteThread({ thread, heading })}
            />
          </OverflowMenu>
        </div>
      </div>

      {isEditing && (
        <TextInput
          className={classes.titleInput}
          id={`${id}:title`}
          labelText="Session title"
          hideLabel
          invalid={errors.title != null}
          onKeyDown={(event) => {
            if (event.code === CODE_ESCAPE) {
              setIsEditing(false);
              reset({ title });
            } else if (event.code === CODE_ENTER) {
              handleSubmit(onSubmit)();
            }
          }}
          {...register('title', {
            onBlur: () => {
              handleSubmit(onSubmit)();
            },
            maxLength: THREAD_TITLE_MAX_LENGTH,
          })}
        />
      )}

      {error && (
        <RetryButton
          onClick={() => {
            refetch();
          }}
        >
          Try again
        </RetryButton>
      )}
    </li>
  ) : null;
}

ThreadItem.Skeleton = function Skeleton() {
  return (
    <li className={classes.root}>
      <div className={classes.skeleton}>
        <SkeletonText className={classes.header} />
        <SkeletonText className={classes.subheading} />
      </div>
    </li>
  );
};

ThreadItem.Error = function Error({
  error,
  refetch,
}: {
  error: Error;
  refetch: () => void;
}) {
  return (
    <li className={clsx(classes.root, classes.error)}>
      <p className={classes.header}>
        <WarningFilled />

        <span className={classes.truncate}>Failed to load</span>
      </p>

      <p className={clsx(classes.subheading, classes.truncate)}>
        {error.message}
      </p>

      <RetryButton
        onClick={() => {
          refetch();
        }}
      >
        Try again
      </RetryButton>
    </li>
  );
};

function RetryButton({ ...props }: ButtonBaseProps) {
  return (
    <Button
      {...props}
      className={classes.retryButton}
      kind="tertiary"
      size="sm"
    >
      Try again
    </Button>
  );
}

export const THREAD_TITLE_MAX_LENGTH = 100;
