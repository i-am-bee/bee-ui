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

import { deleteArtifact } from '@/app/api/artifacts';
import {
  ArtifactDeleteResult,
  ArtifactsListResponse,
} from '@/app/api/artifacts/types';
import { useModal } from '@/layout/providers/ModalProvider';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useArtifactsQueries } from '..';
import { Artifact } from '../../types';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';

interface Props {
  onSuccess?: (data?: ArtifactDeleteResult) => void;
}

export function useDeleteArtifact({ onSuccess }: Props = {}) {
  const { openConfirmation } = useModal();
  const { organization, project } = useWorkspace();
  const artifactsQueries = useArtifactsQueries();
  const { onItemDelete } = useUpdateDataOnMutation<ArtifactsListResponse>();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteArtifact(organization.id, project.id, id),
    onSuccess: (data, id) => {
      onItemDelete({
        id,
        listQueryKey: artifactsQueries.lists(),
        detailQueryKey: artifactsQueries.detail(id).queryKey,
      });
      onSuccess?.();
    },
    meta: {
      errorToast: {
        title: 'Failed to delete the app',
        includeErrorMessage: true,
      },
    },
  });

  const mutateAsyncWithConfirmation = (artifact: Artifact) =>
    openConfirmation({
      title: `Delete ${artifact.name}?`,
      body: 'Are you sure you want to delete this app? Once an app is deleted, it can’t be undone.',
      primaryButtonText: 'Delete',
      danger: true,
      onSubmit: () => mutation.mutateAsync(artifact.id),
    });

  return {
    ...mutation,
    mutateAsyncWithConfirmation,
  };
}
