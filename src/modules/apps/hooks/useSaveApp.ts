import { createArtifact, updateArtifact } from '@/app/api/artifacts';
import { ArtifactCreateBody, ArtifactResult } from '@/app/api/artifacts/types';
import { Project } from '@/app/api/projects/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listArtifactsQuery, readArtifactQuery } from '../queries';

interface Props {
  project: Project;
  onSaveSuccess?: (artifact: ArtifactResult) => void;
}

export function useSaveApp({ project, onSaveSuccess }: Props) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: ArtifactCreateBody }) => {
      return id
        ? updateArtifact(project.id, id, body)
        : createArtifact(project.id, body);
    },
    onSuccess: (artifact, { id }) => {
      queryClient.invalidateQueries({
        queryKey: [listArtifactsQuery(project.id).queryKey.at(0)],
      });

      if (artifact) {
        queryClient.invalidateQueries({
          queryKey: readArtifactQuery(project.id, artifact.id).queryKey,
        });

        onSaveSuccess?.(artifact);
      }
    },
    meta: {
      errorToast: {
        title: 'Failed to save the app',
      },
    },
  });
}
