import { listArtifacts, readArtifact } from '@/app/api/artifacts';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { Artifact } from './types';
import { ArtifactsListQuery } from '@/app/api/artifacts/types';
import { isNotNull } from '@/utils/helpers';

export const readArtifactQuery = (projectId: string, id: string) =>
  queryOptions({
    queryKey: ['artifact', projectId, id],
    queryFn: () => readArtifact(projectId, id),
    select: (data) => (data ? decodeEntityWithMetadata<Artifact>(data) : null),
    staleTime: 10 * 60 * 1000,
  });

export const listArtifactsQuery = (
  projectId: string,
  params?: ArtifactsListQuery,
) =>
  infiniteQueryOptions({
    queryKey: ['artifacts', projectId, params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      listArtifacts(projectId, {
        ...params,
        limit: params?.limit || PAGE_SIZE,
        after: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage?.has_more && lastPage?.last_id
        ? lastPage.last_id
        : undefined;
    },
    select(data) {
      const artifacts = data.pages
        .flatMap((page) => page?.data)
        .filter(isNotNull)
        .map((item) => decodeEntityWithMetadata<Artifact>(item));
      return {
        artifacts,
        totalCount: data.pages.at(0)?.total_count,
      };
    },
    meta: {
      errorToast: false,
    },
  });

const PAGE_SIZE = 10;
