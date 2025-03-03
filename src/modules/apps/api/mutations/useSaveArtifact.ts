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

import { createArtifact, updateArtifact } from '@/app/api/artifacts';
import {
  ArtifactCreateBody,
  ArtifactsListResponse,
  ArtifactUpdateBody,
} from '@/app/api/artifacts/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useArtifactsQueries } from '..';
import { Artifact } from '../../types';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';

type Props = {
  onSuccess?: (data?: Artifact) => void;
};

export function useSaveArtifact({ onSuccess }: Props = {}) {
  const { project, organization } = useWorkspace();
  const artifactsQueries = useArtifactsQueries();
  const { onItemUpdate } = useUpdateDataOnMutation<ArtifactsListResponse>();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }:
      | { id: string; body: ArtifactUpdateBody }
      | { id?: undefined; body: ArtifactCreateBody }) => {
      const result = await (id
        ? updateArtifact(
            organization.id,
            project.id,
            id,
            body as ArtifactUpdateBody,
          )
        : createArtifact(
            organization.id,
            project.id,
            body as ArtifactCreateBody,
          ));

      return result;
    },
    onSuccess: (data) => {
      onItemUpdate({
        data: data
          ? {
              ...data,
              metadata: data.metadata ?? null,
            }
          : undefined,
        listQueryKey: artifactsQueries.lists(),
        detailQueryKey: data && artifactsQueries.detail(data.id).queryKey,
      });

      const artifact = data && decodeEntityWithMetadata<Artifact>(data);
      onSuccess?.(artifact);
    },
    meta: {
      errorToast: {
        title: 'Failed to save the app',
      },
    },
  });

  return mutation;
}
