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

import { deleteProjectUser } from '@/app/api/projects-users';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useMutation } from '@tanstack/react-query';
import { useProjectUsersQueries } from '..';

export function useDeleteProjectUser() {
  const { organization, project } = useWorkspace();
  const projectUsersQueries = useProjectUsersQueries();

  const mutation = useMutation({
    mutationFn: (id: string) =>
      deleteProjectUser(organization.id, project.id, id),
    meta: {
      invalidates: [projectUsersQueries.lists()],
      errorToast: {
        title: 'Failed to remove the user',
        includeErrorMessage: true,
      },
    },
  });

  return mutation;
}
