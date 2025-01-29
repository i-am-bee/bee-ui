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
