import { useMutation } from '@tanstack/react-query';
import { deleteApiKey } from '@/app/api/api-keys';

export function useDeleteApiKey({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      deleteApiKey(projectId, id),
    onSuccess,
    meta: {
      errorToast: {
        title: 'Failed to delete the api key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
