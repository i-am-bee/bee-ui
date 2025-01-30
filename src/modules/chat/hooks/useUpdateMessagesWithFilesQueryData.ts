/**
 * Copyright 2025 IBM Corp.
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

import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { MessageWithFiles, MessageWithFilesResponse } from '../types';
import { useThreadsQueries } from '../api';
import { produce } from 'immer';

export function useUpdateMessagesWithFilesQueryData() {
  const queryClient = useQueryClient();
  const threadsQueries = useThreadsQueries();

  const updateMessageData = useCallback(
    (
      threadId?: string,
      newMessage?: MessageWithFiles | null,
      runId?: string,
    ) => {
      if (threadId) {
        if (newMessage) {
          queryClient.setQueriesData<InfiniteData<MessageWithFilesResponse>>(
            {
              queryKey: threadsQueries.messagesWithFilesList(threadId).queryKey,
            },
            produce((draft) => {
              if (!draft?.pages) return null;

              let isNew = true;
              for (const page of draft.pages) {
                const existingIndex = page.data.findIndex(
                  (item) => item.id === newMessage.id,
                );
                if (existingIndex && existingIndex !== -1) {
                  page.data?.splice(existingIndex, 1, newMessage);
                  isNew = false;
                }
              }

              if (isNew) {
                draft.pages.at(0)?.data.unshift(newMessage);
              }
            }),
          );
        }

        queryClient.invalidateQueries({
          queryKey: threadsQueries.messagesWithFilesLists(threadId),
        });
        if (runId) {
          queryClient.invalidateQueries({
            queryKey: threadsQueries.runStepsLists(threadId, runId),
          });
        }
      }
    },
    [queryClient, threadsQueries],
  );

  return { updateMessageData };
}
