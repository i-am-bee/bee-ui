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
  ProjectCreateBody,
  ProjectsListResponse,
  ProjectUpdateResponse,
} from '@/app/api/projects/types';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useProjectsQueries } from '..';
import { PROJECTS_QUERY_PARAMS } from '../queries/useListAllProjects';

interface Props {
  onSuccess?: (data?: ProjectUpdateResponse) => void;
}

export function useUpdateProject({ onSuccess }: Props = {}) {
  const { organization } = useWorkspace();
  const projectsQueries = useProjectsQueries();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProjectCreateBody }) =>
      updateProject(organization.id, id, body),
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData<InfiniteData<ProjectsListResponse>>(
          projectsQueries.list(PROJECTS_QUERY_PARAMS).queryKey,
          produce((draft) => {
            if (!draft?.pages) return null;
            for (const page of draft.pages) {
              page.data = page.data.map((item) =>
                item.id === variables.id
                  ? { ...item, ...variables.body }
                  : item,
              );
            }
          }),
        );

        queryClient.invalidateQueries(projectsQueries.detail(variables.id));
      }

      onSuccess?.(data);
    },
    meta: {
      invalidates: [projectsQueries.lists()],
      errorToast: {
        title: 'Failed to rename the workspace',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
