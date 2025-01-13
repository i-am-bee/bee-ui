import { createApiKey } from '@/app/api/api-keys';
import { ApiKey, ApiKeysCreateBody } from '@/app/api/api-keys/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ProjectWithScope } from '@/modules/projects/types';
import { useMutation } from '@tanstack/react-query';
import { useApiKeysQueries } from './queries';

export function useCreateApiKey({
  onSuccess,
}: {
  onSuccess?: (apiKey?: ApiKey) => void;
}) {
  const { organization } = useAppContext();
  const apiKeyQueries = useApiKeysQueries();

  const mutation = useMutation({
    mutationFn: ({
      project,
      ...body
    }: { project: ProjectWithScope } & ApiKeysCreateBody) =>
      createApiKey(organization.id, project.id, body),
    onSuccess,
    meta: {
      invalidates: [apiKeyQueries.lists()],
      errorToast: {
        title: 'Failed to create API key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
