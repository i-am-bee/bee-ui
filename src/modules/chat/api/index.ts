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

import { listThreads, readThread } from '@/app/api/threads';
import {
  listMessages,
  listMessagesWithFiles,
} from '@/app/api/threads-messages';
import { MessagesListQuery } from '@/app/api/threads-messages/types';
import {
  listRuns,
  listRunSteps,
  readRun,
  readTrace,
} from '@/app/api/threads-runs';
import {
  RunsListQuery,
  RunStepsQuery,
  ThreadRun,
} from '@/app/api/threads-runs/types';
import { Thread, ThreadsListQuery } from '@/app/api/threads/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

export function useThreadsQueries() {
  const { organization, project } = useAppContext();

  const threadsQueries = {
    all: () => [project.id, 'threads'] as const,
    lists: () => [...threadsQueries.all(), 'list'] as const,
    list: (params?: ThreadsListQuery) => {
      const usedParams = {
        limit: THREADS_DEFAULT_PAGE_SIZE,
        ...params,
      };

      return infiniteQueryOptions({
        queryKey: [...threadsQueries.lists(), usedParams],
        queryFn: ({ pageParam }: { pageParam?: string }) =>
          listThreads(organization.id, project.id, {
            ...usedParams,
            after: pageParam,
          }),
        initialPageParam: undefined,
        getNextPageParam(lastPage) {
          return lastPage?.has_more && lastPage?.last_id
            ? lastPage.last_id
            : undefined;
        },
        select(data) {
          return data.pages
            .flatMap((page) => page?.data)
            .map((item) => {
              if (!item) return null;
              const thread = decodeEntityWithMetadata<Thread>(item);
              return thread.uiMetadata.title ? thread : null;
            })
            .filter(isNotNull);
        },
        meta: {
          errorToast: false,
        },
      });
    },
    // TODO: The thread detail is not used anywhere on the client, so it's probably not necessary.
    details: () => [...threadsQueries.all(), 'detail'] as const,
    detail: (id: string) =>
      queryOptions({
        queryKey: [...threadsQueries.details(), id],
        queryFn: () => readThread(organization.id, project.id, id),
        select: (data) =>
          data ? decodeEntityWithMetadata<Thread>(data) : null,
        meta: {
          errorToast: {
            title: 'Failed to load thread',
            includeErrorMessage: true,
          },
        },
      }),
    messagesLists: (threadId: string) => [
      ...threadsQueries.detail(threadId).queryKey,
      'messages-list',
    ],
    messagesList: (threadId: string, params?: MessagesListQuery) =>
      queryOptions({
        queryKey: [...threadsQueries.messagesLists(threadId), params],
        queryFn: () =>
          listMessages(organization.id, project.id, threadId, params),
        staleTime: 60 * 60 * 1000,
      }),
    messagesWithFilesLists: (threadId: string) => [
      ...threadsQueries.messagesLists(threadId),
      'with-files',
    ],
    messagesWithFilesList: (threadId: string, params?: MessagesListQuery) =>
      queryOptions({
        queryKey: [...threadsQueries.messagesWithFilesLists(threadId), params],
        queryFn: () =>
          listMessagesWithFiles(organization.id, project.id, threadId, params),
      }),
    runsLists: (threadId: string) => [
      ...threadsQueries.detail(threadId).queryKey,
      'runs-list',
    ],
    runsList: (threadId: string, params?: RunsListQuery) =>
      queryOptions({
        queryKey: [...threadsQueries.runsLists(threadId), params],
        queryFn: () => listRuns(organization.id, project.id, threadId, params),
        meta: {
          errorToast: false,
        },
      }),
    runDetails: (threadId: string) => [
      ...threadsQueries.detail(threadId).queryKey,
      'run',
    ],
    runDetail: (threadId: string, runId: string) =>
      queryOptions({
        queryKey: [...threadsQueries.runDetails(threadId), runId],
        queryFn: () => readRun(organization.id, project.id, threadId, runId),
        select: (data) =>
          data ? decodeEntityWithMetadata<ThreadRun>(data) : undefined,
        meta: {
          errorToast: false,
        },
      }),
    runTrace: (threadId: string, runId: string) =>
      queryOptions({
        queryKey: [
          ...threadsQueries.runDetail(threadId, runId).queryKey,
          'trace',
        ],
        queryFn: () => readTrace(organization.id, project.id, threadId, runId),
        meta: {
          errorToast: false,
        },
      }),
    runStepsLists: (threadId: string, runId: string) => [
      ...threadsQueries.runDetail(threadId, runId).queryKey,
      'steps-list',
    ],
    runStepsList: (threadId: string, runId: string, params?: RunStepsQuery) => {
      const usedParams: RunStepsQuery = {
        order: 'asc',
        ...params,
      };

      return queryOptions({
        queryKey: [
          ...threadsQueries.runStepsLists(threadId, runId),
          usedParams,
        ],
        queryFn: () =>
          listRunSteps(
            organization.id,
            project.id,
            threadId,
            runId,
            usedParams,
          ),
        staleTime: 24 * 60 * 60 * 1000, // 1 day
        meta: {
          errorToast: {
            title: 'Failed to load steps for the message.',
            includeErrorMessage: true,
          },
        },
      });
    },
  };

  return threadsQueries;
}

export const THREADS_DEFAULT_PAGE_SIZE = 20;
