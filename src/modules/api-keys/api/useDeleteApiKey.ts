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
import { deleteApiKey } from '@/app/api/api-keys';
import { apiKeysQuery } from './queries';

export function useDeleteApiKey({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      deleteApiKey(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [apiKeysQuery().queryKey.at(0)],
      });

      onSuccess?.();
    },
    meta: {
      errorToast: {
        title: 'Failed to delete the api key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
