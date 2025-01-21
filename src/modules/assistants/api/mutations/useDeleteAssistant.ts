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

import { deleteAssistant } from '@/app/api/assistants';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { useMutation } from '@tanstack/react-query';
import { useAssistantsQueries } from '..';
import { Assistant } from '../../types';
import { getAssistantName } from '../../utils';

interface Props {
  onSuccess?: () => void;
}

export function useDeleteAssistant({ onSuccess }: Props) {
  const { openConfirmation } = useModal();
  const { project, organization } = useAppContext();
  const assistantsQueries = useAssistantsQueries();

  const mutation = useMutation({
    mutationFn: (id: string) =>
      deleteAssistant(organization.id, project.id, id),
    onSuccess,
    meta: {
      invalidates: [assistantsQueries.lists()],
      errorToast: {
        title: 'Failed to delete the app',
        includeErrorMessage: true,
      },
    },
  });

  const mutateWithConfirmationAsync = (assistant: Assistant) =>
    openConfirmation({
      title: `Delete ${getAssistantName(assistant)}?`,
      body: 'Are you sure you want to delete this app? Once an app is deleted, it can’t be undone.',
      primaryButtonText: 'Delete agent',
      danger: true,
      onSubmit: () => mutation.mutateAsync(assistant.id),
    });

  return {
    ...mutation,
    mutateWithConfirmationAsync,
  };
}
