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

import { updateThread } from '@/app/api/threads';
import {
  Thread,
  ThreadsListResponse,
  ThreadUpdateBody,
} from '@/app/api/threads/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useThreadsQueries } from '..';

export function useUpdateThread() {
  const queryClient = useQueryClient();
  const { project, organization } = useAppContext();
  const threadsQueries = useThreadsQueries();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: ThreadUpdateBody;
    }) => {
      const result = await updateThread(organization.id, project.id, id, body);

      return {
        result,
        thread: result && decodeEntityWithMetadata<Thread>(result),
      };
    },
    onSuccess: (data) => {
      const { result } = data;

      if (result) {
        queryClient.setQueryData<InfiniteData<ThreadsListResponse>>(
          threadsQueries.list().queryKey,
          produce((draft) => {
            if (!draft?.pages) return null;
            for (const page of draft.pages) {
              const index = page.data.findIndex(
                (item) => item.id === result.id,
              );
              if (index >= 0 && result) {
                page?.data.splice(index, 1, result);
              }
            }
          }),
        );

        // TODO: The thread detail is not used anywhere on the client, so it's probably not necessary.
        queryClient.invalidateQueries(threadsQueries.detail(result.id));
      }
    },
    meta: {
      invalidates: [threadsQueries.lists()],
      errorToast: {
        title: 'Failed to update session',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
