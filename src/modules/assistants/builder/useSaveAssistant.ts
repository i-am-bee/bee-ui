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
  AssistantResult,
} from '@/app/api/assistants/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAssistantsQueries } from '../queries';

interface Props {
  onSuccess?: (assistant: AssistantResult, isNew: boolean) => void;
}

export function useSaveAssistant({ onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { project, organization } = useAppContext();
  const assistantsQueries = useAssistantsQueries();

  const {
    mutate: saveAssistant,
    mutateAsync: saveAssistantAsync,
    isPending,
  } = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: AssistantCreateBody }) => {
      return id
        ? updateAssistant(organization.id, project.id, id, body)
        : createAssistant(organization.id, project.id, body);
    },
    onSuccess: (data, values) => {
      if (data)
        queryClient.invalidateQueries(assistantsQueries.detail(data.id));

      data && onSuccess?.(data, !values.id);
    },
    meta: {
      invalidates: [assistantsQueries.lists()],
      errorToast: {
        title: 'Failed to save the assistant',
        includeErrorMessage: true,
      },
    },
  });

  return { saveAssistant, saveAssistantAsync, isPending };
}
