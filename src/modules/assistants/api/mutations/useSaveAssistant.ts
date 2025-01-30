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

import { createAssistant, updateAssistant } from '@/app/api/assistants';
import {
  AssistantCreateBody,
  AssistantsListResponse,
} from '@/app/api/assistants/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAssistantsQueries } from '..';
import { Assistant } from '../../types';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';

interface Props {
  onSuccess?: (data?: Assistant, isNew?: boolean) => void;
}

export function useSaveAssistant({ onSuccess }: Props = {}) {
  const queryClient = useQueryClient();
  const assistantsQueries = useAssistantsQueries();
  const { project, organization } = useWorkspace();
  const { onItemUpdate } = useUpdateDataOnMutation<AssistantsListResponse>();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id?: string;
      body: AssistantCreateBody;
    }) => {
      const result = await (id
        ? updateAssistant(organization.id, project.id, id, body)
        : createAssistant(organization.id, project.id, body));

      return result;
    },
    onSuccess: (data, { id }) => {
      onItemUpdate({
        data,
        listQueryKey: assistantsQueries.lists(),
        detailQueryKey: data && assistantsQueries.detail(data.id).queryKey,
      });

      const assistant = data && decodeEntityWithMetadata<Assistant>(data);
      onSuccess?.(assistant, !id);
    },
    meta: {
      errorToast: {
        title: 'Failed to save the assistant',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
