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

import { deleteThread } from '@/app/api/threads';
import { Thread, ThreadsListResponse } from '@/app/api/threads/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useThreadsQueries } from '..';

interface Props {
  thread: Thread;
  onMutate?: () => void;
}

export function useDeleteThread({ thread, onMutate }: Props) {
  const queryClient = useQueryClient();
  const threadsQueries = useThreadsQueries();
  const { project, organization } = useAppContext();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteThread(organization.id, project.id, id),
    onMutate,
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<ThreadsListResponse>>(
        threadsQueries.list().queryKey,
        produce((draft) => {
          if (!draft?.pages) return null;
          for (const page of draft.pages) {
            const index = page.data.findIndex((item) => item.id === thread.id);
            if (index >= 0) {
              page.data.splice(index, 1);
            }
          }
        }),
      );
    },
    meta: {
      invalidates: [threadsQueries.lists()],
      errorToast: {
        title: 'Failed to delete session',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
