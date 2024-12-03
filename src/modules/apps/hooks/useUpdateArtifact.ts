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
import { Project } from '@/app/api/projects/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listArtifactsQuery, readArtifactQuery } from '../queries';
import { Artifact } from '../types';
import { Organization } from '@/app/api/organization/types';

interface Props {
  project: Project;
  organization: Organization;
  artifact: Artifact;
  onSaveSuccess?: (artifact: ArtifactResult) => void;
}

export function useUpdateArtifact({
  project,
  organization,
  artifact,
  onSaveSuccess,
}: Props) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ArtifactUpdateBody) => {
      return updateArtifact(organization.id, project.id, artifact.id, body);
    },
    onSuccess: (artifactResult) => {
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

        artifactResult && onSaveSuccess?.(artifactResult);
      }
    },
    meta: {
      errorToast: {
        title: 'Failed to save the app',
      },
    },
  });
}
