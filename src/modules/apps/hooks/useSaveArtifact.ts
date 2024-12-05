import { createArtifact, updateArtifact } from '@/app/api/artifacts';
import {
  ArtifactCreateBody,
  ArtifactResult,
  ArtifactUpdateBody,
} from '@/app/api/artifacts/types';
import { Project } from '@/app/api/projects/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listArtifactsQuery, readArtifactQuery } from '../queries';

type Props = {
  project: Project;
  onSuccess?: (artifact: ArtifactResult) => void;
};

export function useSaveArtifact({ project, onSuccess }: Props) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }:
      | { id: string; body: ArtifactUpdateBody }
      | { id?: undefined; body: ArtifactCreateBody }) =>
      id
        ? updateArtifact(project.id, id, body as ArtifactUpdateBody)
        : createArtifact(project.id, body as ArtifactCreateBody),
    onSuccess: (artifact) => {
      queryClient.invalidateQueries({
        queryKey: [listArtifactsQuery(project.id).queryKey.at(0)],
      });

      if (artifact) {
        queryClient.invalidateQueries({
          queryKey: readArtifactQuery(project.id, artifact.id).queryKey,
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
