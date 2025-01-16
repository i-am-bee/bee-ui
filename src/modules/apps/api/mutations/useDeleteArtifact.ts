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
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { useMutation } from '@tanstack/react-query';
import { useArtifactsQueries } from '..';
import { Artifact } from '../../types';

interface Props {
  artifact?: Artifact;
  onSuccess?: () => void;
}

export function useDeleteArtifact({ artifact, onSuccess }: Props) {
  const { openConfirmation } = useModal();
  const { organization, project } = useAppContext();
  const artifactsQueries = useArtifactsQueries();

  const mutation = useMutation({
    mutationFn: (id: string) => deleteArtifact(organization.id, project.id, id),
    onSuccess,
    meta: {
      invalidates: [artifactsQueries.lists()],
      errorToast: {
        title: 'Failed to delete the app',
        includeErrorMessage: true,
      },
    },
  });

  const mutateWithConfirmationAsync = () =>
    artifact &&
    openConfirmation({
      title: `Delete ${artifact.name}?`,
      body: 'Are you sure you want to delete this app? Once an app is deleted, it can’t be undone.',
      primaryButtonText: 'Delete',
      danger: true,
      onSubmit: () => mutation.mutateAsync(artifact.id),
    });

  return {
    ...mutation,
    mutateWithConfirmationAsync,
  };
}
