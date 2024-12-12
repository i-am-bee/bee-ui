import { useQueryClient } from '@tanstack/react-query';
import { threadsQuery } from './queries';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

export function usePrefetchThreads() {
  const { project, organization } = useProjectContext();
  const queryClient = useQueryClient();

  return () =>
    queryClient.prefetchInfiniteQuery(
      threadsQuery(organization.id, project.id),
    );
}
