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
  ToolResult,
  ToolsCreateBody,
  ToolUpdateBody,
} from '@/app/api/tools/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToolsQueries } from '..';

interface Props {
  onSuccess?: (data?: ToolResult, isNew?: boolean) => void;
}

export function useSaveTool({ onSuccess }: Props = {}) {
  const queryClient = useQueryClient();
  const toolsQueries = useToolsQueries();
  const { project, organization } = useWorkspace();

  const mutation = useMutation({
    mutationFn: ({ id, body }: MutationBody) => {
      return id !== null
        ? updateTool(organization.id, project.id, id, body)
        : createTool(organization.id, project.id, body);
    },
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.invalidateQueries(toolsQueries.detail(data.id));
      }

      onSuccess?.(data, !variables.id);
    },
    meta: {
      invalidates: [toolsQueries.lists()],
      errorToast: {
        title: 'Failed to save the tool',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}

type MutationBody =
  | { id: null; body: ToolsCreateBody }
  | { id: string; body: ToolUpdateBody };
