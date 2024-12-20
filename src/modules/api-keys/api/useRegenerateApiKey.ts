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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiKey, deleteApiKey } from '@/app/api/api-keys';
import { ApiKey } from '@/app/api/api-keys/types';
import { apiKeysQuery } from './queries';
import { Organization } from '@/app/api/organization/types';

export function useRegenerateApiKey({
  organization,
  onSuccess,
}: {
  onSuccess?: (apiKey?: ApiKey) => void;
  organization: Organization;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, name, project }: ApiKey) => {
      const result = await createApiKey(organization.id, project.id, { name });
      await deleteApiKey(organization.id, project.id, id);
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [apiKeysQuery(organization.id).queryKey.at(0)],
      });
      onSuccess?.(result);
    },
    meta: {
      errorToast: {
        title: 'Failed to regenerate the api key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
