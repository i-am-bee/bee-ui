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

import { createVectorStore } from '@/app/api/vector-stores';
import {
  VectorStoreCreateBody,
  VectorStoreCreateResponse,
} from '@/app/api/vector-stores/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useVectorStoresQueries } from '..';

interface Props {
  onSuccess?: (data?: VectorStoreCreateResponse) => void;
}

export function useCreateVectorStore({ onSuccess }: Props = {}) {
  const { project, organization } = useWorkspace();
  const vectorStoresQueries = useVectorStoresQueries();

  const mutation = useMutation({
    mutationFn: (body: VectorStoreCreateBody) =>
      createVectorStore(organization.id, project.id, body),
    onSuccess,
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: {
        title: 'Failed to create the knowledge base',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
