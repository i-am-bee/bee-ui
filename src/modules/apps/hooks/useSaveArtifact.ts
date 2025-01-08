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
  ArtifactResult,
  ArtifactUpdateBody,
} from '@/app/api/artifacts/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listArtifactsQuery, readArtifactQuery } from '../queries';
import { useAppContext } from '@/layout/providers/AppProvider';

type Props = {
  onSuccess?: (artifact: ArtifactResult) => void;
};

export function useSaveArtifact({ onSuccess }: Props) {
  const { project, organization } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }:
      | { id: string; body: ArtifactUpdateBody }
      | { id?: undefined; body: ArtifactCreateBody }) =>
      id
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
          ),
    onSuccess: (artifact) => {
      queryClient.invalidateQueries({
        queryKey: [
          listArtifactsQuery(organization.id, project.id).queryKey.at(0),
        ],
      });

      if (artifact) {
        queryClient.invalidateQueries({
          queryKey: readArtifactQuery(organization.id, project.id, artifact.id)
            .queryKey,
        });

        onSuccess?.(artifact);
      }
    },
    meta: {
      errorToast: {
        title: 'Failed to save the app',
      },
    },
  });
}
