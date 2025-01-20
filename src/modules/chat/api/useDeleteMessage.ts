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

import { deleteMessage } from '@/app/api/threads-messages';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThreadsQueries } from '../queries';

export function useDeleteMessage() {
  const { project, organization } = useAppContext();
  const queryClient = useQueryClient();
  const threadsQueries = useThreadsQueries();

  const mutation = useMutation({
    mutationFn: ({ threadId, messageId }: DeleteMutationParams) =>
      deleteMessage(organization.id, project.id, threadId, messageId),
    onSuccess: (_, { threadId }) => {
      queryClient.invalidateQueries({
        queryKey: threadsQueries.messagesLists(threadId),
      });
    },
  });

  return mutation;
}

interface DeleteMutationParams {
  threadId: string;
  messageId: string;
}
