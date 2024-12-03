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

import { useModal } from '@/layout/providers/ModalProvider';
import { useMutation } from '@tanstack/react-query';
import { useAppContext } from '@/layout/providers/AppProvider';
import { Tool } from '@/app/api/tools/types';
import { deleteTool } from '@/app/api/tools';

interface Props {
  tool: Tool;
  onSuccess?: () => void;
}

export function useDeleteTool({ tool, onSuccess }: Props) {
  const { openConfirmation } = useModal();
  const { project, organization } = useAppContext();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => deleteTool(organization.id, project.id, id),
    onSuccess,
    meta: {
      errorToast: {
        title: 'Failed to delete the tool',
        includeErrorMessage: true,
      },
    },
  });

  const deleteWithConfirmation = () =>
    openConfirmation({
      title: `Delete ${tool.name}?`,
      body: 'Are you sure you want to delete this tool? Once the tool is deleted, it can’t be undone.',
      primaryButtonText: 'Delete tool',
      danger: true,
      onSubmit: () => mutateAsync(tool.id),
    });

  return { deleteTool: deleteWithConfirmation, isPending };
}
