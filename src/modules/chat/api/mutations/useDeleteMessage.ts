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
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useThreadsQueries } from '..';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';
import { MessagesListResponse } from '@/app/api/threads-messages/types';

export function useDeleteMessage() {
  const { project, organization } = useWorkspace();
  const threadsQueries = useThreadsQueries();
  const { onItemDelete } = useUpdateDataOnMutation<MessagesListResponse>();

  const mutation = useMutation({
    mutationFn: ({
      threadId,
      messageId,
    }: {
      threadId: string;
      messageId: string;
    }) => deleteMessage(organization.id, project.id, threadId, messageId),
    onSuccess: (data, variables) => {
      onItemDelete({
        id: variables.messageId,
        listQueryKey: threadsQueries.messagesLists(variables.threadId),
      });
    },
  });

  return mutation;
}
