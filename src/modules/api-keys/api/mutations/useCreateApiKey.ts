/**
 * Copyright 2025 IBM Corp.
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

import { createApiKey } from '@/app/api/api-keys';
import { ApiKey, ApiKeysCreateBody } from '@/app/api/api-keys/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ProjectWithScope } from '@/modules/projects/types';
import { useMutation } from '@tanstack/react-query';
import { useApiKeysQueries } from '..';

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
