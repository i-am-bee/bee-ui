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
import { useAppContext } from '@/layout/providers/AppProvider';
import { useQueryClient } from '@tanstack/react-query';
import { toolsQuery } from '../queries';
import { TOOLS_ORDER_DEFAULT, TOOLS_PAGE_SIZE } from '../ToolsList';

const DEFAULT_PARAMS: Partial<ToolsListQuery> = {
  type: ['user'],
  limit: TOOLS_PAGE_SIZE,
  ...TOOLS_ORDER_DEFAULT,
};

export function usePrefetchTools({
  useDefaultParams,
}: {
  useDefaultParams?: boolean;
}) {
  const { project, organization } = useAppContext();
  const queryClient = useQueryClient();

  return (params?: ToolsListQuery) =>
    queryClient.prefetchInfiniteQuery(
      toolsQuery(organization.id, project.id, {
        ...(useDefaultParams ? DEFAULT_PARAMS : {}),
        ...params,
      }),
    );
}
