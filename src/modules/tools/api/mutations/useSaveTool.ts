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

import { createTool, updateTool } from '@/app/api/tools';
import {
  ToolCreateBody,
  ToolResponse,
  ToolsListResponse,
  ToolUpdateBody,
} from '@/app/api/tools/types';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useToolsQueries } from '..';

interface Props {
  onSuccess?: (data?: ToolResponse, isNew?: boolean) => void;
}

export function useSaveTool({ onSuccess }: Props = {}) {
  const toolsQueries = useToolsQueries();
  const { project, organization } = useWorkspace();
  const { onItemUpdate } = useUpdateDataOnMutation<ToolsListResponse>();

  const mutation = useMutation({
    mutationFn: ({ id, body }: MutationBody) => {
      return id !== null
        ? updateTool(organization.id, project.id, id, body)
        : createTool(organization.id, project.id, body);
    },
    onSuccess: (data, variables) => {
      if (data) {
        onItemUpdate({
          data,
          listQueryKey: toolsQueries.lists(),
          detailQueryKey: toolsQueries.detail(data.id).queryKey,
        });
      }

      onSuccess?.(data, !variables.id);
    },
    meta: {
      errorToast: {
        title: 'Failed to save the tool',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}

type MutationBody =
  | { id: null; body: ToolCreateBody }
  | { id: string; body: ToolUpdateBody };
