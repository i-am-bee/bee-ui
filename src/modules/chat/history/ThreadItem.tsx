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
import { deleteThread } from '@/app/api/threads';
import {
  Thread,
  ThreadMetadata,
  ThreadsListResponse,
} from '@/app/api/threads/types';
import { encodeMetadata } from '@/app/api/utils';
import { Link } from '@/components/Link/Link';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
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
import {
  InfiniteData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import clsx from 'clsx';
import { produce } from 'immer';
import { CODE_ENTER, CODE_ESCAPE } from 'keycode-js';
import truncate from 'lodash/truncate';
import { useRouter } from 'next-nprogress-bar';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useThreadApi } from '../hooks/useThreadApi';
import { listMessagesQuery } from '../queries';
import { FileCount } from './FileCount';
import { threadsQuery } from './queries';
import classes from './ThreadItem.module.scss';
import {
  getThreadAssistantName,
  useGetThreadAssistant,
} from './useGetThreadAssistant';
import { useThreadFileCount } from './useThreadFileCount';

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
  const { openConfirmation } = useModal();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { project, organization } = useAppContext();
  const id = useId();
  const href = `/${project.id}/thread/${thread.id}`;
  const isActive = pathname === href;
  const assistant = useGetThreadAssistant(thread);
  const { title } = thread.uiMetadata;
  const fileCount = useThreadFileCount(thread);

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
    ...listMessagesQuery(organization.id, project.id, thread.id, { limit: 1 }),
    enabled: !title,
  });

  const { mutateAsync: mutateDeleteThread, isPending: isDeletePending } =
    useMutation({
      mutationFn: (id: string) => deleteThread(organization.id, project.id, id),
      onMutate: () => {
        if (isActive) {
          router.push(getNewSessionUrl(project.id, assistant.data));
        }
      },
      onSuccess: () => {
        queryClient.setQueryData<InfiniteData<ThreadsListResponse>>(
          threadsQuery(organization.id, project.id).queryKey,
          produce((draft) => {
            if (!draft?.pages) return null;
            for (const page of draft.pages) {
              const index = page.data.findIndex(
                (item) => item.id === thread.id,
              );
              if (index >= 0) {
                page.data.splice(index, 1);
              }
            }
          }),
        );

        queryClient.invalidateQueries({
          queryKey: threadsQuery(organization.id, project.id).queryKey,
        });
      },
      meta: {
        errorToast: {
          title: 'Failed to delete session',
          includeErrorMessage: true,
        },
      },
    });

  const {
    updateMutation: { mutateAsync: mutateUpdateThread },
  } = useThreadApi(thread);

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (values) => {
      setIsEditing(false);

      if (!values.title || values.title === title) {
        reset({ title });

        return;
      }

      await mutateUpdateThread({
        metadata: encodeMetadata<ThreadMetadata>({
          ...thread.uiMetadata,
          title: values.title,
        }),
      });
    },
    [title, mutateUpdateThread, thread.uiMetadata, reset],
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
          >
            <OverflowMenuItem
              disabled={!isValid || isSubmitting}
              itemText="Rename"
              onClick={() => setIsEditing(true)}
            />
            <OverflowMenuItem
              isDelete
              itemText="Delete"
              onClick={() =>
                openConfirmation({
                  title: `Delete session?`,
                  body: `“${heading}” will be deleted`,
                  primaryButtonText: 'Delete session',
                  danger: true,
                  onSubmit: () => mutateDeleteThread(thread.id),
                })
              }
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
