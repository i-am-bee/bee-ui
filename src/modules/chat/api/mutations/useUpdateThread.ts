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
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useThreadsQueries } from '..';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';
import {
  decodeEntityWithMetadata,
  encodeEntityWithMetadata,
} from '@/app/api/utils';

interface Props {
  optimistic?: boolean;
}

export function useUpdateThread({ optimistic }: Props = {}) {
  const { project, organization } = useWorkspace();
  const threadsQueries = useThreadsQueries();
  const { onItemUpdate } = useUpdateDataOnMutation<ThreadsListResponse>();

  const mutation = useMutation({
    mutationFn: async ({
      thread: { id },
      body,
    }: {
      thread: Thread;
      body: ThreadUpdateBody;
    }) => {
      const result = await updateThread(organization.id, project.id, id, body);

      const thread = result && decodeEntityWithMetadata<Thread>(result);

      return thread;
    },
    onMutate: ({ thread, body: { tool_resources, metadata, ...body } }) => {
      if (optimistic) {
        onItemUpdate({
          data: {
            ...encodeEntityWithMetadata<Thread>(thread),
            ...body,
          },
          listQueryKey: threadsQueries.lists(),
          invalidateQueries: false,
        });
      }
    },
    onSuccess: (data, { thread }) => {
      onItemUpdate({
        data: data && encodeEntityWithMetadata<Thread>(data),
        listQueryKey: threadsQueries.lists(),
        detailQueryKey: threadsQueries.detail(thread.id).queryKey,
      });
    },
    meta: {
      errorToast: {
        title: 'Failed to update session',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
