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

import { createProject } from '@/app/api/projects';
import { Project, ProjectCreateBody } from '@/app/api/projects/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useProjectsQueries } from '..';

interface Props {
  onSuccess?: (data?: Project) => void;
}

export function useCreateProject({ onSuccess }: Props = {}) {
  const { organization } = useWorkspace();
  const projectsQueries = useProjectsQueries();

  const mutation = useMutation({
    mutationFn: (body: ProjectCreateBody) =>
      createProject(organization.id, body),
    onSuccess,
    meta: {
      invalidates: [projectsQueries.lists()],
      errorToast: {
        title: 'Failed to create the project',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
