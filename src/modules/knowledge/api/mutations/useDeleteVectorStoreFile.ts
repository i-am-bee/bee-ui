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

import { deleteVectorStoreFile } from '@/app/api/vector-stores-files';
import { VectorStoreFile } from '@/app/api/vector-stores-files/types';
import { VectorStore } from '@/app/api/vector-stores/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { TrashCan } from '@carbon/react/icons';
import { useMutation } from '@tanstack/react-query';
import { useVectorStoresQueries } from '..';

interface Props {
  onSuccess?: () => void;
}

export function useDeleteVectorStoreFile({ onSuccess }: Props = {}) {
  const { organization, project } = useAppContext();
  const { openConfirmation } = useModal();
  const vectorStoresQueries = useVectorStoresQueries();

  const mutation = useMutation({
    mutationFn: async ({
      vectorStoreId,
      id,
    }: {
      vectorStoreId: string;
      id: string;
    }) => {
      const result = await deleteVectorStoreFile(
        organization.id,
        project.id,
        vectorStoreId,
        id,
      );

      return {
        result,
        vectorStoreId,
      };
    },
    onSuccess: ({ result, vectorStoreId }) => {
      if (result) {
        vectorStoresQueries.detail(vectorStoreId);
      }

      onSuccess?.();
    },
    meta: {
      invalidates: [vectorStoresQueries.lists()],
      errorToast: {
        title: 'Failed to delete the file',
        includeErrorMessage: true,
      },
    },
  });

  const mutateWithConfirmationAsync = ({
    vectorStore,
    vectorStoreFile,
    filename,
  }: {
    vectorStore: VectorStore;
    vectorStoreFile: VectorStoreFile;
    filename?: string;
  }) =>
    openConfirmation({
      title: 'Delete document?',
      // TODO: add apps info "Are you sure you would like to delete Lorem-Ipsum.pdf? It is currently used by 3 apps."
      body: `Are you sure you would like to delete ${filename ? filename : 'this document'}?`,
      primaryButtonText: 'Delete document',
      danger: true,
      icon: TrashCan,
      size: 'md',
      onSubmit: () =>
        mutation.mutateAsync({
          vectorStoreId: vectorStore.id,
          id: vectorStoreFile.id,
        }),
    });

  return {
    ...mutation,
    mutateWithConfirmationAsync,
  };
}
