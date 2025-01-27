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

import { readFile, readFileContent } from '@/app/api/files';
import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { queryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useFilesQueries() {
  const { organization, project } = useWorkspace();

  const filesQueries = useMemo(
    () => ({
      all: () => [project.id, 'files'] as const,
      details: () => [...filesQueries.all(), 'detail'] as const,
      detail: (id: string) =>
        queryOptions({
          queryKey: [...filesQueries.details(), id],
          queryFn: () => readFile(organization.id, project.id, id),
          staleTime: 60 * 60 * 1000,
        }),
      content: (id: string) =>
        queryOptions({
          queryKey: [...filesQueries.detail(id).queryKey, 'content'],
          queryFn: () => readFileContent(organization.id, project.id, id),
        }),
    }),
    [organization.id, project.id],
  );

  return filesQueries;
}
