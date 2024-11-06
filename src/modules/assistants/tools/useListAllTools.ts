import { Tool } from '@/app/api/tools/types';
import { MAX_API_FETCH_LIMIT } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { toolsQuery } from '@/modules/tools/queries';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

export function useListAllTools() {
  const { project } = useAppContext();

  const { data, error, hasNextPage, fetchNextPage, isFetching, isLoading } =
    useInfiniteQuery({
      ...toolsQuery(project.id, { limit: MAX_API_FETCH_LIMIT }),
    });

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
