import { useArtifacts } from './useArtifacts';

export function useArtifactsTotalCount() {
  const { data } = useArtifacts({ params: { limit: 1 } });

  return data?.totalCount;
}
