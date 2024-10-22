import {
  Thread,
  ThreadCreateBody,
  ThreadsListResponse,
  ThreadUpdateBody,
} from '@/app/api/threads/types';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { createThread, deleteThread, updateThread } from '@/app/api/threads';
import { threadQuery, threadsQuery } from '../history/queries';
import { useAppContext } from '@/layout/providers/AppProvider';
import { produce } from 'immer';

export function useThreadApi(thread: Thread | null) {
  const queryClient = useQueryClient();
  const { project } = useAppContext();

  const updateMutation = useMutation({
    mutationFn: (body: ThreadUpdateBody) =>
      updateThread(project.id, thread?.id ?? '', body),
    onSuccess: (data) => {
      queryClient.setQueryData<InfiniteData<ThreadsListResponse>>(
        threadsQuery(project.id).queryKey,
        produce((draft) => {
          if (!draft?.pages) return null;
          for (const page of draft.pages) {
            const index = page.data.findIndex((item) => item.id === thread?.id);

            if (index >= 0 && data) {
              page?.data.splice(index, 1, data);
            }
          }
        }),
      );

      queryClient.invalidateQueries({
        queryKey: threadsQuery(project.id).queryKey,
      });

      queryClient.invalidateQueries({
        queryKey: threadQuery(project.id, thread?.id ?? '').queryKey,
      });
    },
    meta: {
      errorToast: {
        title: 'Failed to update session',
        includeErrorMessage: true,
      },
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: ThreadCreateBody) => createThread(project.id, body),
    meta: {
      errorToast: {
        title: 'Failed to create session',
        includeErrorMessage: true,
      },
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThread(project.id, id),
    meta: {
      errorToast: false,
    },
  });

  return {
    updateMutation,
    createMutation,
    deleteMutation,
  };
}
