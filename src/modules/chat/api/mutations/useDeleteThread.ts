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
import { useModal } from '@/layout/providers/ModalProvider';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useThreadsQueries } from '..';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';

interface Props {
  onMutate?: () => void;
}

export function useDeleteThread({ onMutate }: Props = {}) {
  const { openConfirmation } = useModal();
  const threadsQueries = useThreadsQueries();
  const { project, organization } = useWorkspace();
  const { onItemDelete } = useUpdateDataOnMutation<ThreadsListResponse>();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteThread(organization.id, project.id, id),
    onMutate,
    onSuccess: (data, id) => {
      if (data) onItemDelete({ id, listQueryKey: threadsQueries.lists() });
    },
    meta: {
      errorToast: {
        title: 'Failed to delete session',
        includeErrorMessage: true,
      },
    },
  });

  const mutateAsyncWithConfirmation = ({
    thread,
    heading,
  }: {
    thread: Thread;
    heading: string;
  }) =>
    openConfirmation({
      title: `Delete session?`,
      body: `“${heading}” will be deleted`,
      primaryButtonText: 'Delete session',
      danger: true,
      onSubmit: () => mutation.mutateAsync(thread.id),
    });

  return {
    ...mutation,
    mutateAsyncWithConfirmation,
  };
}
