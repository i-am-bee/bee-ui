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

import { Tool } from '@/app/api/tools/types';
import { MAX_API_FETCH_LIMIT } from '@/app/api/utils';
import { useTools } from '@/modules/tools/hooks/useTools';
import { useEffect, useMemo } from 'react';

export function useListAllTools() {
  const { data, error, hasNextPage, fetchNextPage, isFetching, isLoading } =
    useTools({ params: { limit: MAX_API_FETCH_LIMIT } });

  useEffect(() => {
    if (!isFetching && hasNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const tools = useMemo(
    () =>
      data?.tools.reduce(
        (result: ListAllToolsReturn, tool) => {
          if (tool.type === 'user') {
            result.user.push(tool);
          } else {
            result.public.push(tool);
          }
          return result;
        },
        { user: [], public: [] },
      ),
    [data],
  );

  return { tools, error, isLoading };
}

interface ListAllToolsReturn {
  user: Tool[];
  public: Tool[];
}
