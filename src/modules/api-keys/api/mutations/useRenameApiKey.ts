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

import { updateApiKey } from '@/app/api/api-keys';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useApiKeysQueries } from '..';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';
import { ApiKeysListResponse } from '@/app/api/api-keys/types';

export function useRenameApiKey() {
  const { organization } = useWorkspace();
  const apiKeysQueries = useApiKeysQueries();
  const { onItemUpdate } = useUpdateDataOnMutation<ApiKeysListResponse>({
    isListInfiniteQuery: false,
  });

  const mutation = useMutation({
    mutationFn: ({
      projectId,
      id,
      name,
    }: {
      projectId: string;
      id: string;
      name: string;
    }) => updateApiKey(organization.id, projectId, id, { name }),
    onSuccess: (data) => {
      onItemUpdate({
        data,
        listQueryKey: apiKeysQueries.lists(),
      });
    },
    meta: {
      errorToast: {
        title: 'Failed to rename the api key',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
