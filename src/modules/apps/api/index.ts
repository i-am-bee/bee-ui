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

import { listArtifacts, readArtifact } from '@/app/api/artifacts';
import { ArtifactsListQuery } from '@/app/api/artifacts/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { Artifact } from '../types';

export function useArtifactsQueries() {
  const { organization, project } = useAppContext();

  const artifactsQueries = {
    all: () => [project.id, 'artifacts'] as const,
    lists: () => [...artifactsQueries.all(), 'list'] as const,
    list: (params?: ArtifactsListQuery) => {
      const usedParams: ArtifactsListQuery = {
        limit: ARTIFACTS_DEFAULT_PAGE_SIZE,
        ...params,
      };

      return infiniteQueryOptions({
        queryKey: [...artifactsQueries.lists(), usedParams],
        queryFn: ({ pageParam }: { pageParam?: string }) =>
          listArtifacts(organization.id, project.id, {
            ...usedParams,
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
    },
    details: () => [...artifactsQueries.all(), 'detail'] as const,
    detail: (id: string) =>
      queryOptions({
        queryKey: [...artifactsQueries.details(), id],
        queryFn: () => readArtifact(organization.id, project.id, id),
        select: (data) =>
          data ? decodeEntityWithMetadata<Artifact>(data) : null,
        staleTime: 10 * 60 * 1000,
      }),
  };

  return artifactsQueries;
}

const ARTIFACTS_DEFAULT_PAGE_SIZE = 10;
