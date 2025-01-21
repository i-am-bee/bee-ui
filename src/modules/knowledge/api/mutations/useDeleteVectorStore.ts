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

import { deleteVectorStore } from '@/app/api/vector-stores';
import {
  VectorStore,
  VectorStoreDeleteResponse,
} from '@/app/api/vector-stores/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { TrashCan } from '@carbon/react/icons';
import { useMutation } from '@tanstack/react-query';
import { useVectorStoresQueries } from '..';

interface Props {
  onSuccess?: (data?: VectorStoreDeleteResponse) => void;
}

export function useDeleteVectorStore({ onSuccess }: Props = {}) {
  const { project, organization } = useAppContext();
  const { openConfirmation } = useModal();
  const vectorStoresQueries = useVectorStoresQueries();

  const mutation = useMutation({
    mutationFn: (id: string) =>
      deleteVectorStore(organization.id, project.id, id),
    onSuccess,
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: {
        title: 'Failed to delete knowledge base',
        includeErrorMessage: true,
      },
    },
  });

  const mutateWithConfirmationAsync = (vectorStore: VectorStore) =>
    openConfirmation({
      title: 'Delete knowledge base?',
      // TODO: add apps info "This knowledge base contains 12 documents and 3 websites, which are used by 2 apps. Are you sure you want to delete it?"
      body: `This knowledge base contains ${vectorStore.file_counts.total} documents. Are you sure you want to delete it?`,
      primaryButtonText: 'Delete knowledge base',
      danger: true,
      icon: TrashCan,
      size: 'md',
      onSubmit: () => mutation.mutateAsync(vectorStore.id),
    });

  return {
    ...mutation,
    mutateWithConfirmationAsync,
  };
}
