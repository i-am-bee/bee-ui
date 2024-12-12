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

import { ToolsListQuery } from '@/app/api/tools/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toolsQuery } from '../queries';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

export function useTools({
  params,
  enabled,
}: {
  params?: ToolsListQuery;
  enabled?: boolean;
} = {}) {
  const { project, organization } = useProjectContext();

  const query = useInfiniteQuery({
    ...toolsQuery(organization.id, project.id, params),
    enabled,
  });

  return query;
}
