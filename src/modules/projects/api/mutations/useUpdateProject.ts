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

import { updateProject } from '@/app/api/projects';
import {
  Project,
  ProjectCreateBody,
  ProjectsListResponse,
  ProjectUpdateResponse,
} from '@/app/api/projects/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useProjectsQueries } from '..';
import { useUpdateDataOnMutation } from '@/hooks/useUpdateDataOnMutation';

interface Props {
  onSuccess?: (data?: ProjectUpdateResponse) => void;
}

export function useUpdateProject({ onSuccess }: Props = {}) {
  const { organization } = useWorkspace();
  const projectsQueries = useProjectsQueries();
  const { onItemUpdate } = useUpdateDataOnMutation<ProjectsListResponse>();

  const mutation = useMutation({
    mutationFn: ({
      project,
      body,
    }: {
      project: Project;
      body: ProjectCreateBody;
    }) => updateProject(organization.id, project.id, body),
    onSuccess: (data, { project }) => {
      if (data) {
        onItemUpdate({
          data: { ...project, ...data },
          listQueryKey: projectsQueries.lists(),
          detailQueryKey: projectsQueries.detail(project.id).queryKey,
        });
      }

      onSuccess?.(data);
    },
    meta: {
      errorToast: {
        title: 'Failed to rename the workspace',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
