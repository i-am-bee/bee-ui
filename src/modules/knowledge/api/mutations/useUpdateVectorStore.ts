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

import { updateVectorStore } from '@/app/api/vector-stores';
import {
  VectorStoreCreateBody,
  VectorStoreCreateResponse,
  VectorStoresListResponse,
} from '@/app/api/vector-stores/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useVectorStoresQueries } from '..';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';

interface Props {
  onSuccess?: (data?: VectorStoreCreateResponse) => void;
}

export function useUpdateVectorStore({ onSuccess }: Props = {}) {
  const { project, organization } = useWorkspace();
  const vectorStoresQueries = useVectorStoresQueries();
  const { onItemUpdate } = useUpdateDataOnMutation<VectorStoresListResponse>();

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: VectorStoreCreateBody }) =>
      updateVectorStore(organization.id, project.id, id, body),
    onSuccess: (data, { id }) => {
      onItemUpdate({
        data,
        listQueryKey: vectorStoresQueries.lists(),
        detailQueryKey: vectorStoresQueries.detail(id).queryKey,
      });

      onSuccess?.(data);
    },
    meta: {
      errorToast: {
        title: 'Failed to rename the knowledge base',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
