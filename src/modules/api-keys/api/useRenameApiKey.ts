import { useMutation } from '@tanstack/react-query';
import { updateApiKey } from '@/app/api/api-keys';

export function useRenameApiKey({ onSuccess }: { onSuccess?: () => void }) {
  const mutation = useMutation({
    mutationFn: ({
      id,
      projectId,
      name,
    }: {
      id: string;
      projectId: string;
      name: string;
    }) => updateApiKey(projectId, id, { name }),
    onSuccess,
    meta: {
      errorToast: {
        title: 'Failed to rename the api key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
