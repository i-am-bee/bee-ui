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

import { createApiKey, deleteApiKey } from '@/app/api/api-keys';
import { ApiKey } from '@/app/api/api-keys/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useMutation } from '@tanstack/react-query';
import { useApiKeysQueries } from '..';

export function useRegenerateApiKey({
  onSuccess,
}: {
  onSuccess?: (data?: ApiKey) => void;
}) {
  const { organization } = useAppContext();
  const apiKeysQueries = useApiKeysQueries();

  const mutation = useMutation({
    mutationFn: async ({ id, name, project }: ApiKey) => {
      const result = await createApiKey(organization.id, project.id, { name });
      await deleteApiKey(organization.id, project.id, id);
      return result;
    },
    onSuccess,
    meta: {
      invalidates: [apiKeysQueries.lists()],
      errorToast: {
        title: 'Failed to regenerate the api key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
